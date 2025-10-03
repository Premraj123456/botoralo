
"""
Flask worker service for running user bots. (Refactored for stateless operation)
Design:
- This backend is STATELESS regarding bot metadata. The Next.js app with Supabase is the source of truth.
- This service's only job is to manage Docker containers. It does not store bot lists or code permanently.
- It receives all necessary info (userId, botId, code) for each operation from the Next.js backend.
- It uses a single MASTER_BACKEND_KEY (in .env) to authenticate requests.
- Bot code is stored in temporary directories named after the bot's Supabase UUID, and cleaned up on deletion.

Security & notes:
- This example uses Docker container isolation with mem_limit and runs user code as non-root.
- For production hardening, add gVisor/Firecracker, seccomp, read-only FS, network egress rules, and strict scanning.
- Ensure the BOT_IMAGE is pre-built with necessary dependencies (e.g., discord.py, python-telegram-bot).
"""

import os
import sys
import datetime
import json
import tempfile
import shutil
import zipfile
import subprocess
import requests
import threading
from functools import wraps
from flask import Flask, request, jsonify, Response, stream_with_context
import docker
from dotenv import load_dotenv

load_dotenv()

# --- Configuration ---
MASTER_BACKEND_KEY = os.getenv('MASTER_BACKEND_KEY')
BOTS_DIR = os.getenv('BOTS_DIR', os.path.join(tempfile.gettempdir(), 'botoralo_bots'))
BOT_IMAGE = os.getenv('BOT_IMAGE', 'bot_runtime:latest') # Assumes a pre-built image
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT = int(os.getenv('FLASK_PORT', '5000'))

# Ensure the base directory for bot code exists
os.makedirs(BOTS_DIR, exist_ok=True)

# Docker client
docker_client = docker.from_env()

app = Flask(__name__)

# --- Decorators & Middleware ---

def require_master_key(f):
    """Decorator to ensure request is authenticated with the master key."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        key = auth_header.split(None, 1)[1].strip()
        if not MASTER_BACKEND_KEY or key != MASTER_BACKEND_KEY:
            return jsonify({'error': 'Unauthorized: Invalid master key'}), 401
        
        return f(*args, **kwargs)
    return decorated


def parse_json_body(required_fields=None):
    """
    Decorator to parse JSON from the request body or 'meta' form field.
    Ensures that all required fields are present.
    """
    required_fields = required_fields or []
    def decorator(f):
        @wraps(f)
        def inner(*args, **kwargs):
            data = None
            # Handle multipart/form-data for file uploads
            if request.content_type and 'multipart/form-data' in request.content_type:
                meta_json = request.form.get('meta')
                if not meta_json:
                    return jsonify({'error': "Missing 'meta' field in form data"}), 400
                try:
                    data = json.loads(meta_json)
                except json.JSONDecodeError:
                    return jsonify({'error': 'Invalid JSON in a "meta" form field'}), 400
            else: # Handle application/json
                try:
                    data = request.get_json(force=True)
                except Exception:
                    return jsonify({'error': 'Invalid or missing JSON body'}), 400

            # Validate required fields
            missing = [field for field in required_fields if field not in (data or {})]
            if missing:
                return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
            
            # Attach parsed data to the request object for easy access in the view function
            request.data_json = data
            return f(*args, **kwargs)
        return inner
    return decorator


# --- Helper Functions ---

def get_container_name(botoralo_bot_id):
    """Generates a consistent and safe container name from the bot's Supabase UUID."""
    return f"botoralo-bot-{botoralo_bot_id}"


def get_bot_code_dir(botoralo_bot_id):
    """Returns the path to the directory where the bot's code will be stored."""
    return os.path.join(BOTS_DIR, str(botoralo_bot_id))


def get_container(botoralo_bot_id):
    """Safely gets a Docker container by bot ID."""
    try:
        return docker_client.containers.get(get_container_name(botoralo_bot_id))
    except docker.errors.NotFound:
        return None

def save_bot_code(bot_code_dir, code_file):
    """Saves uploaded code file or extracts zip archive."""
    file_extension = os.path.splitext(code_file.filename)[1].lower()
    
    if file_extension == '.zip':
        zip_path = os.path.join(bot_code_dir, 'source.zip')
        code_file.save(zip_path)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(bot_code_dir)
        os.remove(zip_path)
    else:
        # It's a single file, save it directly.
        code_file.save(os.path.join(bot_code_dir, code_file.filename))

def install_dependencies(container):
    """Installs dependencies from requirements.txt or package.json inside the container."""
    bot_code_dir = get_bot_code_dir(container.name.replace("botoralo-bot-", ""))
    
    if os.path.exists(os.path.join(bot_code_dir, 'requirements.txt')):
        print(f"Found requirements.txt, installing Python dependencies for {container.name}...")
        exit_code, output = container.exec_run('pip install --no-cache-dir -r /bot/requirements.txt')
        if exit_code != 0:
             raise RuntimeError(f"Failed to install Python dependencies: {output.decode(errors='ignore')}")
        print(f"Python dependencies installed for {container.name}.")

    if os.path.exists(os.path.join(bot_code_dir, 'package.json')):
        print(f"Found package.json, installing Node.js dependencies for {container.name}...")
        exit_code, output = container.exec_run('npm install')
        if exit_code != 0:
            raise RuntimeError(f"Failed to install Node.js dependencies: {output.decode(errors='ignore')}")
        print(f"Node.js dependencies installed for {container.name}.")


def _start_bot_process(botoralo_bot_id):
    """Internal function to handle the full start process."""
    container = get_container(botoralo_bot_id)
    if not container:
        raise RuntimeError(f"Container not found for bot {botoralo_bot_id}")

    try:
        container.start()
        install_dependencies(container)
        container.restart(timeout=5)
        app.logger.info(f"Successfully started and restarted bot container {botoralo_bot_id}")
    except Exception as e:
        app.logger.error(f"Error during async start for {botoralo_bot_id}: {str(e)}")
        try:
            container.stop(timeout=5)
        except Exception as stop_error:
            app.logger.error(f"Failed to stop container {botoralo_bot_id} after start error: {stop_error}")
        # Note: Consider a webhook to update DB status to 'error' here


# --- API Endpoints ---
@app.route('/deploy', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId', 'name'])
def deploy_bot():
    """
    Saves bot code, creates a container, and optionally starts it.
    - meta: JSON string with userId, botoraloBotId, name, auto_start (boolean).
    - code: The user's code file (e.g., .py, .js, or .zip).
    """
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    memory_mb = int(data.get('memory_mb', 128))
    auto_start = data.get('auto_start', False)

    if 'code' not in request.files:
        return jsonify({'error': "Missing 'code' file in form data"}), 400
    
    code_file = request.files['code']
    bot_code_dir = get_bot_code_dir(botoralo_bot_id)

    if os.path.exists(bot_code_dir):
        shutil.rmtree(bot_code_dir)
    os.makedirs(bot_code_dir, exist_ok=True)
    
    try:
        save_bot_code(bot_code_dir, code_file)
        
        main_script_name = code_file.filename
        main_script_cmd = None

        if main_script_name.endswith('.zip'):
             if os.path.exists(os.path.join(bot_code_dir, 'package.json')):
                with open(os.path.join(bot_code_dir, 'package.json')) as f:
                    pkg = json.load(f)
                    if pkg.get('scripts', {}).get('start'):
                        main_script_cmd = ['npm', 'start']
                    elif pkg.get('main'):
                        main_script_cmd = ['node', pkg['main']]
             if not main_script_cmd:
                py_scripts = [f for f in os.listdir(bot_code_dir) if f.endswith('.py')]
                if 'main.py' in py_scripts:
                    main_script_cmd = ['python', '-u', 'main.py']
                elif 'bot.py' in py_scripts:
                    main_script_cmd = ['python', '-u', 'bot.py']
                elif py_scripts:
                    main_script_cmd = ['python', '-u', py_scripts[0]]
        else: # Single file upload
             if main_script_name.endswith(('.js', '.ts')):
                 main_script_cmd = ['node', main_script_name]
             elif main_script_name.endswith('.py'):
                 main_script_cmd = ['python', '-u', main_script_name]
        
        if not main_script_cmd:
            raise RuntimeError("Could not determine the main script to run.")
        
        container_name = get_container_name(botoralo_bot_id)
        existing_container = get_container(botoralo_bot_id)
        if existing_container:
            existing_container.remove(force=True)

        container = docker_client.containers.create(
            BOT_IMAGE,
            command=main_script_cmd,
            name=container_name,
            detach=True,
            mem_limit=f"{memory_mb}m",
            network_mode='bridge', 
            volumes={bot_code_dir: {'bind': '/bot', 'mode': 'rw'}},
            working_dir='/bot',
            read_only=False, 
            tty=False,
            user='1000:1000'
        )
        
        if auto_start:
            thread = threading.Thread(target=_start_bot_process, args=(botoralo_bot_id,))
            thread.daemon = True
            thread.start()

    except Exception as e:
        shutil.rmtree(bot_code_dir, ignore_errors=True)
        app.logger.error(f"Error deploying bot {botoralo_bot_id}: {str(e)}")
        return jsonify({'error': 'Failed to deploy bot', 'details': str(e)}), 500

    return jsonify({
        'status': 'starting' if auto_start else 'deployed',
        'botoraloBotId': botoralo_bot_id,
        'containerId': container.id,
    }), 201


@app.route('/start', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def start_bot():
    """
    Installs dependencies and starts a created or stopped container.
    """
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    container = get_container(botoralo_bot_id)
    
    if not container:
        return jsonify({'error': 'Bot is not deployed. Please deploy it first.'}), 404
    
    if container.status == 'running':
        return jsonify({'status': 'already_running'})

    thread = threading.Thread(target=_start_bot_process, args=(botoralo_bot_id,))
    thread.daemon = True
    thread.start()

    return jsonify({'status': 'starting'})


@app.route('/stop', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def stop_bot():
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    container = get_container(botoralo_bot_id)
    
    if not container:
        return jsonify({'status': 'already_stopped'}), 200
        
    if container.status != 'running':
        return jsonify({'status': 'already_stopped'}), 200

    try:
        container.stop(timeout=5)
        return jsonify({'status': 'stopped'})
    except Exception as e:
        app.logger.error(f"Failed to stop container for bot {botoralo_bot_id}: {str(e)}")
        return jsonify({'error': 'Failed to stop container', 'details': str(e)}), 500


@app.route('/delete', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def delete_bot():
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    container = get_container(botoralo_bot_id)

    if container:
        try:
            container.remove(force=True)
        except Exception as e:
            app.logger.warning(f"Could not remove container for bot {botoralo_bot_id}: {str(e)}")


    bot_code_dir = get_bot_code_dir(botoralo_bot_id)
    if os.path.exists(bot_code_dir):
        shutil.rmtree(bot_code_dir, ignore_errors=True)

    return jsonify({'status': 'deleted'})


@app.route('/info', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def info_bot():
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    container = get_container(botoralo_bot_id)
    
    if not container:
        return jsonify({'bot': {'status': 'stopped', 'botoraloBotId': botoralo_bot_id}}), 200

    container.reload()
    info = {
        'botoraloBotId': botoralo_bot_id,
        'container_id': container.id,
        'status': container.status,
        'uptime_started_at': container.attrs.get('State', {}).get('StartedAt'),
        'memory_mb': int(container.attrs.get('HostConfig', {}).get('Memory', 0) / 1024 / 1024)
    }
    return jsonify({'bot': info})

@app.route('/stats', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def stats_bot():
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    container = get_container(botoralo_bot_id)

    if not container or container.status != 'running':
        return jsonify({'memory_usage_mb': 0, 'cpu_usage_percent': 0}), 200
    
    try:
        stats = container.stats(stream=False)
        mem_usage = stats.get('memory_stats', {}).get('usage', 0)
        mem_usage_mb = mem_usage / (1024 * 1024)
        
        return jsonify({'memory_usage_mb': round(mem_usage_mb, 2)}), 200
    except Exception:
        return jsonify({'memory_usage_mb': 0}), 200


@app.route('/logs', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def logs():
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    container = get_container(botoralo_bot_id)

    if not container:
        def empty_stream():
            yield 'data: [info] Bot is not running or does not exist. No logs to display.\\n\\n'
        return Response(stream_with_context(empty_stream()), mimetype='text/event-stream')

    def generate():
        try:
            # Yield last 100 lines first
            past_logs = container.logs(stream=False, tail=100).decode(errors='replace')
            for line in past_logs.splitlines():
                yield f"data: {line.strip()}\\n\\n"
            
            # Then follow new logs
            for chunk in container.logs(stream=True, follow=True, since=datetime.datetime.utcnow()):
                yield f"data: {chunk.decode(errors='replace').strip()}\\n\\n"
        except docker.errors.NotFound:
            yield "data: [error] Container not found. It may have been stopped or deleted.\\n\\n"
        except Exception as e:
            app.logger.error(f"Log streaming error for {botoralo_bot_id}: {str(e)}")
            yield f"data: [error] An error occurred while streaming logs: {str(e)}\\n\\n"

    return Response(stream_with_context(generate()), mimetype='text/event-stream')


# --- Healthcheck ---
@app.route('/_health')
def health():
    """Health check endpoint."""
    try:
        docker_client.ping()
        docker_ok = True
    except Exception:
        docker_ok = False
    
    if docker_ok:
        return jsonify({'status': 'ok', 'docker': 'ok'})
    else:
        return jsonify({'status': 'error', 'docker': 'not connected'}), 503

# --- Main execution ---
if __name__ == '__main__':
    if not MASTER_BACKEND_KEY or len(MASTER_BACKEND_KEY) < 32:
        print("CRITICAL ERROR: MASTER_BACKEND_KEY is not set or is too short.", file=sys.stderr)
        print("Please set a secure key of at least 32 characters in your .env file.", file=sys.stderr)
        sys.exit(1)

    print(f"Starting Flask worker on {FLASK_HOST}:{FLASK_PORT}")
    print(f"Storing bot code under: {BOTS_DIR}")
    print("WARNING: This is a development server. Do not use in a production environment.")
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=False)

    