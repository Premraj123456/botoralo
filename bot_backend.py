
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
import traceback
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

def save_bot_code(bot_code_dir, files):
    """Saves uploaded code, accepting a single file, a directory structure, or a zip file."""
    app.logger.info(f"Saving bot code to {bot_code_dir}")
    
    # Check for zip file first
    zip_file = files.get('code_zip')
    if zip_file and zip_file.filename:
        if not zip_file.filename.endswith('.zip'):
             raise ValueError("The uploaded archive must be a .zip file.")
        zip_path = os.path.join(bot_code_dir, 'source.zip')
        zip_file.save(zip_path)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(bot_code_dir)
        os.remove(zip_path)
        app.logger.info(f"Extracted zip archive to {bot_code_dir}")
        return

    # Handle single file or directory upload
    uploaded_files = files.getlist('code')
    if not uploaded_files or not uploaded_files[0].filename:
        raise ValueError("No code files were provided in the upload.")

    if len(uploaded_files) == 1 and not uploaded_files[0].filename.endswith('.zip'):
        # Single file upload
        file = uploaded_files[0]
        file.save(os.path.join(bot_code_dir, file.filename))
        app.logger.info(f"Saved single file: {file.filename}")
    else:
        # Directory upload (multiple files)
        for file in uploaded_files:
            # The 'filename' in a directory upload includes the relative path
            save_path = os.path.join(bot_code_dir, file.filename)
            # Ensure parent directories exist
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            file.save(save_path)
        app.logger.info(f"Saved {len(uploaded_files)} files from directory upload.")


def detect_runtime_and_entrypoint(bot_code_dir):
    """
    Detects the runtime (node/python) and the command to run the bot.
    Priority:
    1. Node.js: package.json with 'start' script
    2. Node.js: package.json with 'main' field
    3. Python: main.py
    4. Python: bot.py
    5. Fallback to first .py file found.
    """
    app.logger.info(f"Detecting runtime and entrypoint in {bot_code_dir}")
    
    # Check for Node.js
    package_json_path = os.path.join(bot_code_dir, 'package.json')
    if os.path.exists(package_json_path):
        app.logger.info("Found package.json, assuming Node.js runtime.")
        with open(package_json_path) as f:
            pkg = json.load(f)
            if pkg.get('scripts', {}).get('start'):
                app.logger.info("Found 'start' script in package.json.")
                # 'npm start' is run by the image's default CMD, so just return the runtime
                return ['npm', 'start']
            if pkg.get('main'):
                entrypoint = pkg['main']
                app.logger.info(f"Found 'main' field in package.json: {entrypoint}")
                return ['node', entrypoint]

    # Check for Python
    py_files = [f for f in os.listdir(bot_code_dir) if f.endswith('.py')]
    if 'main.py' in py_files:
        app.logger.info("Found main.py, assuming Python runtime.")
        return ['python', '-u', 'main.py']
    if 'bot.py' in py_files:
        app.logger.info("Found bot.py, assuming Python runtime.")
        return ['python', '-u', 'bot.py']
    if py_files:
        entrypoint = py_files[0]
        app.logger.warning(f"No explicit entrypoint found, falling back to first Python file: {entrypoint}")
        return ['python', '-u', entrypoint]

    raise RuntimeError("Could not determine the main script to run. Please use a standard entrypoint like main.py, bot.py, or a package.json with a 'start' or 'main' field.")


def install_dependencies(container):
    """Installs dependencies from requirements.txt or package.json inside the container."""
    botoralo_bot_id = container.name.replace("botoralo-bot-", "")
    bot_code_dir = get_bot_code_dir(botoralo_bot_id)
    app.logger.info(f"Checking for dependencies for bot {botoralo_bot_id}")

    requirements_path = os.path.join(bot_code_dir, 'requirements.txt')
    if os.path.exists(requirements_path):
        app.logger.info(f"Found requirements.txt, installing Python dependencies for {container.name}...")
        exit_code, output = container.exec_run('pip install --no-cache-dir -r /bot/requirements.txt')
        if exit_code != 0:
             logs = output.decode(errors='ignore')
             app.logger.error(f"Failed to install Python dependencies for {container.name}: {logs}")
             raise RuntimeError(f"Failed to install Python dependencies: {logs}")
        app.logger.info(f"Python dependencies installed for {container.name}.")

    package_json_path = os.path.join(bot_code_dir, 'package.json')
    if os.path.exists(package_json_path):
        app.logger.info(f"Found package.json, installing Node.js dependencies for {container.name}...")
        # Use 'npm ci' for faster, more reliable installs if package-lock.json exists
        lock_file_exists = os.path.exists(os.path.join(bot_code_dir, 'package-lock.json'))
        install_command = 'npm ci' if lock_file_exists else 'npm install'
        
        exit_code, output = container.exec_run(install_command)
        if exit_code != 0:
            logs = output.decode(errors='ignore')
            app.logger.error(f"Failed to install Node.js dependencies for {container.name}: {logs}")
            raise RuntimeError(f"Failed to install Node.js dependencies: {logs}")
        app.logger.info(f"Node.js dependencies installed for {container.name}.")


def _start_bot_process(botoralo_bot_id):
    """Internal function to handle the full start process."""
    app.logger.info(f"Starting bot process for {botoralo_bot_id}")
    container = get_container(botoralo_bot_id)
    if not container:
        app.logger.error(f"Container not found for bot {botoralo_bot_id} during start process.")
        raise RuntimeError(f"Container not found for bot {botoralo_bot_id}")

    try:
        app.logger.info(f"Starting container {container.name}")
        container.start()
        install_dependencies(container)
        # Restart is crucial to apply any newly installed dependencies that might be needed at boot
        app.logger.info(f"Restarting container {container.name} to apply dependencies.")
        container.restart(timeout=10)
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
    Saves bot code (from file, dir, or zip), creates a container, and optionally starts it.
    - meta: JSON string with userId, botoraloBotId, name, auto_start (boolean).
    - code: The user's code file(s) (e.g., bot.py).
    - code_zip: The user's zipped project.
    """
    data = request.data_json
    botoralo_bot_id = data['botoraloBotId']
    memory_mb = int(data.get('memory_mb', 128))
    auto_start = data.get('auto_start', False)
    debug_mode = data.get('debug', False)
    
    app.logger.info(f"--- Deployment started for bot {botoralo_bot_id} ---")

    bot_code_dir = get_bot_code_dir(botoralo_bot_id)

    # Clean up previous deployment
    if os.path.exists(bot_code_dir):
        shutil.rmtree(bot_code_dir)
    os.makedirs(bot_code_dir, exist_ok=True)
    
    try:
        # 1. Save code from upload
        save_bot_code(bot_code_dir, request.files)
        
        # 2. Determine runtime and entrypoint command
        main_script_cmd = detect_runtime_and_entrypoint(bot_code_dir)
        app.logger.info(f"Determined run command for {botoralo_bot_id}: {' '.join(main_script_cmd)}")
        
        # 3. Remove any existing container
        container_name = get_container_name(botoralo_bot_id)
        existing_container = get_container(botoralo_bot_id)
        if existing_container:
            app.logger.warning(f"Removing existing container for bot {botoralo_bot_id}")
            existing_container.remove(force=True)

        # 4. Create the new container
        app.logger.info(f"Creating Docker container '{container_name}' with image '{BOT_IMAGE}'")
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
            user='1000:1000' # Run as non-root user
        )
        app.logger.info(f"Container {container.id} created successfully.")
        
        # 5. Start the bot if requested
        if auto_start:
            app.logger.info(f"Auto-start is enabled. Starting bot {botoralo_bot_id} in a background thread.")
            thread = threading.Thread(target=_start_bot_process, args=(botoralo_bot_id,))
            thread.daemon = True
            thread.start()

    except Exception as e:
        # Clean up failed deployment
        shutil.rmtree(bot_code_dir, ignore_errors=True)
        app.logger.error(f"Error deploying bot {botoralo_bot_id}: {str(e)}")
        if debug_mode:
            trace = traceback.format_exc()
            app.logger.error(trace)
            return jsonify({'error': 'Failed to deploy bot', 'details': str(e), 'trace': trace}), 500
        return jsonify({'error': 'Failed to deploy bot', 'details': str(e)}), 500

    app.logger.info(f"--- Deployment finished for bot {botoralo_bot_id} ---")
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
    app.logger.info(f"Received request to start bot {botoralo_bot_id}")
    container = get_container(botoralo_bot_id)
    
    if not container:
        app.logger.error(f"Cannot start bot {botoralo_bot_id}: container not found.")
        return jsonify({'error': 'Bot is not deployed. Please deploy it first.'}), 404
    
    if container.status == 'running':
        app.logger.warning(f"Bot {botoralo_bot_id} is already running.")
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
    app.logger.info(f"Received request to stop bot {botoralo_bot_id}")
    container = get_container(botoralo_bot_id)
    
    if not container or container.status != 'running':
        app.logger.warning(f"Bot {botoralo_bot_id} is already stopped or does not exist.")
        return jsonify({'status': 'already_stopped'}), 200

    try:
        container.stop(timeout=10)
        app.logger.info(f"Successfully stopped container for bot {botoralo_bot_id}")
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
    app.logger.info(f"Received request to delete bot {botoralo_bot_id}")
    container = get_container(botoralo_bot_id)

    if container:
        try:
            app.logger.info(f"Removing container for bot {botoralo_bot_id}")
            container.remove(force=True)
        except Exception as e:
            app.logger.warning(f"Could not remove container for bot {botoralo_bot_id} (may have already been removed): {str(e)}")

    bot_code_dir = get_bot_code_dir(botoralo_bot_id)
    if os.path.exists(bot_code_dir):
        app.logger.info(f"Deleting code directory {bot_code_dir}")
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
    app.run(host=FLAST_HOST, port=FLASK_PORT, debug=True)

    