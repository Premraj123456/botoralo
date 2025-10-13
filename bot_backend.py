import os
import sys
import json
import tempfile
import shutil
import zipfile
import traceback
import threading
import time
from functools import wraps, lru_cache
from flask import Flask, request, jsonify, Response, stream_with_context
import docker
from dotenv import load_dotenv
from queue import Queue, Empty
from collections import deque, defaultdict
import logging
from logging.config import dictConfig

# --- Logging Setup ---
dictConfig({
    'version': 1,
    'formatters': {'default': {'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',}},
    'handlers': {'wsgi': {'class': 'logging.StreamHandler','stream': 'ext://sys.stdout','formatter': 'default'}},
    'root': {'level': 'DEBUG','handlers': ['wsgi']}
})

load_dotenv()

log_buffers = {}       # bot_id -> Queue()
log_history = {}       # bot_id -> deque(maxlen=100)
active_connections = defaultdict(int)

MASTER_BACKEND_KEY = os.getenv("MASTER_BACKEND_KEY")
BOTS_DIR = os.getenv("BOTS_DIR", os.path.join(tempfile.gettempdir(), "botoralo_bots"))
BOT_IMAGE = os.getenv("BOT_IMAGE", "bot_runtime:latest")
FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.getenv("FLASK_PORT", "5000"))

os.makedirs(BOTS_DIR, exist_ok=True)

docker_client = docker.from_env()
docker_api = docker.APIClient(base_url='unix://var/run/docker.sock')
app = Flask(__name__)

def require_master_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing/invalid Authorization header"}), 401
        key = auth_header.split(None, 1)[1].strip()
        if not MASTER_BACKEND_KEY or key != MASTER_BACKEND_KEY:
            return jsonify({"error": "Unauthorized: Invalid master key"}), 401
        return f(*args, **kwargs)
    return decorated

def parse_json_body(required_fields=None):
    required_fields = required_fields or []
    def decorator(f):
        @wraps(f)
        def inner(*args, **kwargs):
            data = None
            if request.content_type and "multipart/form-data" in request.content_type:
                meta_json = request.form.get("meta")
                if not meta_json:
                    return jsonify({"error": "Missing 'meta' field in form data"}), 400
                try:
                    data = json.loads(meta_json)
                except json.JSONDecodeError:
                    return jsonify({"error": "Invalid JSON in 'meta' field"}), 400
            else:
                try:
                    data = request.get_json(force=True)
                except Exception:
                    return jsonify({"error": "Invalid or missing JSON body"}), 400

            missing = [f for f in required_fields if f not in (data or {})]
            if missing:
                return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

            request.data_json = data
            return f(*args, **kwargs)
        return inner
    return decorator

def get_container_name(bot_id):
    return f"botoralo-bot-{bot_id}"

def get_bot_code_dir(bot_id):
    return os.path.join(BOTS_DIR, str(bot_id))

def get_container(bot_id):
    try:
        return docker_client.containers.get(get_container_name(bot_id))
    except docker.errors.NotFound:
        return None

def save_bot_code(bot_code_dir, files):
    app.logger.info(f"Saving code to {bot_code_dir}")
    os.makedirs(bot_code_dir, exist_ok=True)
    zip_file = files.get("code_zip")
    if zip_file and zip_file.filename:
        if not zip_file.filename.endswith(".zip"):
            raise ValueError("Uploaded archive must be a .zip file.")
        zip_path = os.path.join(bot_code_dir, "source.zip")
        zip_file.save(zip_path)
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(bot_code_dir)
        os.remove(zip_path)
        return
    uploaded_files = files.getlist("code")
    if not uploaded_files or not uploaded_files[0].filename:
        raise ValueError("No code files were provided.")
    if len(uploaded_files) == 1:
        f = uploaded_files[0]
        f.save(os.path.join(bot_code_dir, f.filename))
        return
    for f in uploaded_files:
        save_path = os.path.join(bot_code_dir, f.filename)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        f.save(save_path)

@lru_cache(maxsize=256)
def detect_runtime_and_entrypoint_cached(bot_code_dir: str):
    files = os.listdir(bot_code_dir)
    lower_files = [f.lower() for f in files]
    package_json = os.path.join(bot_code_dir, "package.json")
    if os.path.exists(package_json):
        with open(package_json) as f:
            pkg = json.load(f)
            if pkg.get("main"):
                return "node", pkg["main"]
        for candidate in ["index.js", "bot.js", "main.js"]:
            if candidate in lower_files:
                return "node", candidate
        raise RuntimeError("Node.js project missing entrypoint.")
    if os.path.exists(os.path.join(bot_code_dir, "requirements.txt")):
        for candidate in ["main.py", "bot.py", "code.py"]:
            if candidate in lower_files:
                return "python", candidate
    for f in files:
        if f.endswith(".py"):
            return "python", f
        if f.endswith(".js"):
            return "node", f
    raise RuntimeError("Could not determine runtime or entrypoint.")

def _start_bot_process(botoralo_bot_id: str):
    q = log_buffers.setdefault(botoralo_bot_id, Queue())
    history = log_history.setdefault(botoralo_bot_id, deque(maxlen=100))
    container = get_container(botoralo_bot_id)
    if not container:
        q.put(f"[error] Container for bot {botoralo_bot_id} not found")
        history.append(f"[error] Container for bot {botoralo_bot_id} not found")
        return
    try:
        runtime, entrypoint = detect_runtime_and_entrypoint_cached(get_bot_code_dir(botoralo_bot_id))
    except Exception as e:
        q.put(f"[error] Failed to detect runtime: {e}")
        history.append(f"[error] Failed to detect runtime: {e}")
        return
    if runtime == "python":
        cmd = ["bash", "-lc", f"python -u /bot/{entrypoint} > /proc/1/fd/1 2>&1"]
        # cmd = ["bash", "-lc", f"{install_cmd} > /proc/1/fd/1 2>&1"],
        env = {"PYTHONUNBUFFERED": "1"}
    else:
        cmd = ["bash", "-lc", f"node /bot/{entrypoint} > /proc/1/fd/1 2>&1"]
        env = {"FORCE_COLOR": "1"}
    try:
        exec_obj = docker_api.exec_create(
            container=get_container_name(botoralo_bot_id),
            cmd=cmd,
            workdir="/bot",
            user="1000:1000",
            tty=True,
            stderr=True,
            stdout=True,
            environment=env
        )
        exec_id = exec_obj.get("Id")
        stream = docker_api.exec_start(exec_id, stream=True, demux=True)

        def stream_logs():
            try:
                stdout_buf, stderr_buf = "", ""
                
                for stdout, stderr in stream:
                    if stdout:
                        stdout_buf += stdout.decode("utf-8", errors="replace")
                        while "\n" in stdout_buf:
                            line, stdout_buf = stdout_buf.split("\n", 1)
                            line = line.strip()
                            if line:
                                q.put(f"[stdout] {line}")
                                history.append(f"[stdout] {line}")
                    if stderr:
                        stderr_buf += stderr.decode("utf-8", errors="replace")
                        while "\n" in stderr_buf:
                            line, stderr_buf = stderr_buf.split("\n", 1)
                            line = line.strip()
                            if line:
                                q.put(f"[stderr] {line}")
                                history.append(f"[stderr] {line}")

            except Exception as e:
                msg = f"[error] Stream error: {e}"
                q.put(msg)
                history.append(msg)
            finally:
                try:
                    info = docker_api.exec_inspect(exec_id)
                    exit_code = info.get("ExitCode")
                    msg = f"[info] process exited with code {exit_code}"
                    q.put(msg)
                    history.append(msg)
                except Exception:
                    pass
        threading.Thread(target=stream_logs, daemon=True).start()
    except Exception as e:
        msg = f"[error] Failed to start exec: {e}"
        q.put(msg)
        history.append(msg)

@app.route('/deploy', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId', 'name'])
def deploy_bot():
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    memory_mb = int(data.get('memory_mb', 128))
    auto_start = data.get('auto_start', False)
    debug_mode = data.get('debug', False)
    bot_code_dir = get_bot_code_dir(botoralo_bot_id)
    if os.path.exists(bot_code_dir):
        shutil.rmtree(bot_code_dir)
    os.makedirs(bot_code_dir, exist_ok=True)
    try:
        save_bot_code(bot_code_dir, request.files)
        runtime, entrypoint = detect_runtime_and_entrypoint_cached(bot_code_dir)
        existing_container = get_container(botoralo_bot_id)
        if existing_container:
            existing_container.remove(force=True)
        container_name = get_container_name(botoralo_bot_id)
        container = docker_client.containers.create(
            BOT_IMAGE,
            command=["bash", "-c", "tail -f /dev/null"],
            name=container_name,
            detach=True,
            mem_limit=f"{memory_mb}m",
            network_mode='bridge',
            volumes={bot_code_dir: {'bind': '/bot', 'mode': 'rw'}},
            working_dir='/bot',
            read_only=False,
            tty=True,
            user='1000:1000'
        )
        container.start()
        log_buffers[botoralo_bot_id] = Queue()          # Reset buffer
        log_history[botoralo_bot_id] = deque(maxlen=100)
        install_cmd = (
            "if [ -f requirements.txt ]; then pip install -r requirements.txt; else pip install python-telegram-bot; fi"
            if runtime == "python" else
            "if [ -f package.json ]; then npm install; else npm install node-telegram-bot-api telegraf; fi"
        )
        exit_code, output = container.exec_run(
            cmd=["bash", "-lc", f"{install_cmd} > /proc/1/fd/1 2>&1"],
            workdir="/bot",
            user="1000:1000",
        )

        if exit_code != 0:
            raise RuntimeError("Dependency installation failed.")
        if auto_start:
            thread = threading.Thread(target=_start_bot_process, args=(botoralo_bot_id,))
            thread.daemon = True
            thread.start()
    except Exception as e:
        shutil.rmtree(bot_code_dir, ignore_errors=True)
        if debug_mode:
            trace = traceback.format_exc()
            return jsonify({'error': str(e), 'trace': trace}), 500
        return jsonify({'error': str(e)}), 500
    return jsonify({
        'status': 'starting' if auto_start else 'deployed',
        'botoraloBotId': botoralo_bot_id,
        'containerId': container.id,
    }), 201

@app.route("/start", methods=["POST"])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def start_bot():
    log_buffers[bot_id] = Queue()
    log_history[bot_id] = deque(maxlen=100)
    bot_id = request.data_json["botoraloBotId"]
    container = get_container(bot_id)
    if not container:
        return jsonify({"error": "Bot not deployed"}), 404
    try:
        container.reload()
    except Exception:
        pass
    if container.status != "running":
        try:
            container.start()
        except Exception as e:
            return jsonify({"error": "Failed to start container", "details": str(e)}), 500
    thread = threading.Thread(target=_start_bot_process, args=(bot_id,))
    thread.daemon = True
    thread.start()
    return jsonify({"status": "starting"})

@app.route("/stop", methods=["POST"])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def stop_bot():
    bot_id = request.data_json["botoraloBotId"]
    container = get_container(bot_id)
    if not container or container.status != "running":
        return jsonify({"status": "already_stopped"}), 200
    try:
        container.stop(timeout=10)
        return jsonify({"status": "stopped"})
    except Exception as e:
        return jsonify({"error": "Failed to stop container", "details": str(e)}), 500

@app.route("/delete", methods=["POST"])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def delete_bot():
    bot_id = request.data_json["botoraloBotId"]
    container = get_container(bot_id)
    if container:
        try:
            container.remove(force=True)
        except Exception:
            pass
    shutil.rmtree(get_bot_code_dir(bot_id), ignore_errors=True)
    log_buffers.pop(bot_id, None)
    log_history.pop(bot_id, None)
    active_connections.pop(bot_id, None)
    return jsonify({"status": "deleted"})

@app.route("/info", methods=["POST"])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def info_bot():
    bot_id = request.data_json["botoraloBotId"]
    container = get_container(bot_id)
    if not container:
        return jsonify({"bot": {"status": "stopped", "botoraloBotId": bot_id}})
    container.reload()
    info = {
        "botoraloBotId": bot_id,
        "container_id": container.id,
        "status": container.status,
        "uptime_started_at": container.attrs.get("State", {}).get("StartedAt"),
        "memory_mb": int(container.attrs.get("HostConfig", {}).get("Memory", 0) / 1024 / 1024)
    }
    return jsonify({"bot": info})

@app.route("/stats", methods=["POST"])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def stats_bot():
    bot_id = request.data_json["botoraloBotId"]
    container = get_container(bot_id)
    if not container or container.status != "running":
        return jsonify({"memory_usage_mb": 0}), 200
    try:
        stats = container.stats(stream=False)
        mem = stats.get("memory_stats", {}).get("usage", 0) / (1024 * 1024)
        return jsonify({"memory_usage_mb": round(mem, 2)})
    except Exception:
        return jsonify({"memory_usage_mb": 0})


@app.route("/logs", methods=["POST"])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def logs():
    bot_id = request.data_json["botoraloBotId"]

    def event_stream():
        container = get_container(bot_id)
        if not container:
            yield "data: [info] Bot not found or stopped\n\n"
            return

        # Send last 100 lines
        past_logs = container.logs(stream=False, tail=100).decode("utf-8", errors="replace")
        for line in past_logs.splitlines():
            yield f"data: {line}\n\n"

        # --- LIVE STREAM FIX ---
        buffer = ""
        for chunk in container.logs(stream=True, follow=True):
            text = chunk.decode("utf-8", errors="replace")
            buffer += text
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if line:
                    yield f"data: {line}\n\n"

        # Flush any trailing text
        if buffer.strip():
            yield f"data: {buffer.strip()}\n\n"

    return Response(
        stream_with_context(event_stream()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.route("/logs2", methods=["POST"])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def logs2():
    botoralo_bot_id = request.data_json["botoraloBotId"]
    active_connections[botoralo_bot_id] += 1
    def event_stream():
        q = log_buffers.setdefault(botoralo_bot_id, Queue())
        history = log_history.setdefault(botoralo_bot_id, deque(maxlen=100))
        for line in list(history):   # Only lines from current run
            yield f"data: {line}\n\n"
        last_message_time = time.time()
        try:
            while True:
                try:
                    line = q.get(timeout=5.0)
                    yield f"data: {line}\n\n"
                    last_message_time = time.time()
                except Empty:
                    yield f"data: [heartbeat] {time.strftime('%H:%M:%S')}\n\n"
                    if time.time() - last_message_time > 300:
                        yield f"data: [info] Log stream timeout\n\n"
                        break
        finally:
            active_connections[botoralo_bot_id] -= 1
            if active_connections[botoralo_bot_id] <= 0:
                log_buffers.pop(botoralo_bot_id, None)
                active_connections.pop(botoralo_bot_id, None)
    return Response(
        stream_with_context(event_stream()),
        mimetype='text/event-stream',
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )

@app.route('/logs_raw', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=["userId", "botoraloBotId"])
def logs_raw():
    botoralo_bot_id = request.data_json["botoraloBotId"]
    def event_stream():
        try:
            container = get_container(botoralo_bot_id)
            if not container:
                yield 'data: [info] Bot is not running or does not exist.\n\n'
                return
            past_logs = container.logs(stream=False, tail=100).decode('utf-8', errors='replace')
            for line in past_logs.splitlines():
                yield f"data: {line}\n\n"
            for chunk in container.logs(stream=True, follow=True):
                yield f"data: {chunk.decode('utf-8', errors='replace').strip()}\n\n"
        except Exception as e:
            yield f"data: [error] Stream error: {str(e)}\n\n"
    response = Response(stream_with_context(event_stream()), mimetype='text/event-stream')
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"
    return response

@app.route("/_health")
def health():
    try:
        docker_client.ping()
        return jsonify({"status": "ok", "docker": "ok"})
    except Exception:
        return jsonify({"status": "error", "docker": "not connected"}), 503


# --- Main execution ---
if __name__ == '__main__':
    if not MASTER_BACKEND_KEY or len(MASTER_BACKEND_KEY) < 32:
        print("CRITICAL ERROR: MASTER_BACKEND_KEY is not set or is too short.", file=sys.stderr)
        print("Please set a secure key of at least 32 characters in your .env file.", file=sys.stderr)
        sys.exit(1)

    print(f"Starting Flask worker on {FLASK_HOST}:{FLASK_PORT}")
    print(f"Storing bot code under: {BOTS_DIR}")
    print("WARNING: This is a development server. Do not use in a production environment.")
    app.run(host=FLAST_HOST, port=FLASK_PORT, debug=True)

    