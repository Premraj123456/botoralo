
"""
Flask worker service for running user bots.
Design:
- Supabase is the source of truth for users.
- Backend uses a single MASTER_BACKEND_KEY (in .env) to authenticate requests from the Botoralo server action.
- Every request must include JSON body fields: userId (Supabase user UUID) and botoraloBotId (Supabase bot UUID).
- Bot.owner is stored as user_id (string). botoralo_bot_id stores the Supabase-side bot id for cross-linking.

Security & notes:
- This example uses Docker container isolation with mem_limit and runs user code as non-root.
- For production hardening, add gVisor/Firecracker, seccomp, read-only FS, network egress rules, and strict scanning.
"""

import os
import datetime
import uuid
import json
import tempfile
from functools import wraps
from flask import Flask, request, jsonify, Response, stream_with_context, send_file
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import create_engine
import docker
from dotenv import load_dotenv

# Optional: requests for Supabase plan checks
import requests

load_dotenv()

# Configuration from env
MASTER_BACKEND_KEY = os.getenv('MASTER_BACKEND_KEY')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
DATA_DIR = os.getenv('DATA_DIR', './data')
BOTS_DIR = os.path.join(DATA_DIR, 'bots')
DB_PATH = os.path.join(DATA_DIR, 'app.db')
BOT_IMAGE = os.getenv('BOT_IMAGE', 'bot_runtime:latest')
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT = int(os.getenv('FLASK_PORT', '5000'))

os.makedirs(BOTS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Docker client
docker_client = docker.from_env()

# Database
Base = declarative_base()

class Bot(Base):
    __tablename__ = 'bots'
    id = Column(Integer, primary_key=True)
    botoralo_bot_id = Column(String, unique=True, nullable=True)  # Supabase bot id
    user_id = Column(String, index=True)  # Supabase user uuid
    name = Column(String)
    code_path = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    memory_mb = Column(Integer, default=128)
    container_id = Column(String, nullable=True)
    status = Column(String, default='stopped')
    uptime_started_at = Column(DateTime, nullable=True)
    auto_restart = Column(Boolean, default=False)

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)

app = Flask(__name__)

# --- Helpers ---

def require_master_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'error': 'Missing Authorization header'}), 401
        key = auth.split(None, 1)[1]
        if not MASTER_BACKEND_KEY or key != MASTER_BACKEND_KEY:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated


def parse_json_body(required_fields=None):
    required_fields = required_fields or []
    def decorator(f):
        @wraps(f)
        def inner(*args, **kwargs):
            if request.content_type and request.content_type.startswith('multipart/form-data'):
                # If file upload, JSON body may be in a form field named 'meta'
                meta = request.form.get('meta')
                try:
                    data = json.loads(meta) if meta else request.form.to_dict()
                except Exception:
                    data = request.form.to_dict()
            else:
                try:
                    data = request.get_json(force=True)
                except Exception:
                    return jsonify({'error': 'Invalid JSON body'}), 400

            missing = [f for f in required_fields if f not in (data or {})]
            if missing:
                return jsonify({'error': f'Missing fields: {missing}'}), 400
            request.data_json = data
            return f(*args, **kwargs)
        return inner
    return decorator


def get_user_plan(user_id):
    """Optional: fetch user's plan from Supabase if configured. Returns plan string (e.g. 'free', 'pro', 'power') or None."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    try:
        # Assumes a `profiles` table or `users` metadata where plan is stored under `plan` column.
        # Adjust path and headers to match your Supabase schema.
        url = f"{SUPABASE_URL}/rest/v1/profiles?select=plan&id=eq.{user_id}"
        headers = {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}'
        }
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            rows = r.json()
            if rows:
                return rows[0].get('plan')
    except Exception:
        pass
    return None


PLANS = {
    'free': {'ram_per_bot_mb': 128, 'bot_slots': 1},
    'pro': {'ram_per_bot_mb': 512, 'bot_slots': 5},
    'power': {'ram_per_bot_mb': 1024, 'bot_slots': 20},
}


def check_plan_allows(user_id, requested_ram_mb=0):
    # If Supabase is configured, try to read plan. Otherwise default to 'free'.
    plan_name = get_user_plan(user_id) or 'free'
    plan = PLANS.get(plan_name, PLANS['free'])
    if requested_ram_mb > plan['ram_per_bot_mb']:
        return False, f"Plan {plan_name} allows up to {plan['ram_per_bot_mb']}MB per bot"
    # Count running bots
    s = Session()
    running = s.query(Bot).filter_by(user_id=user_id, status='running').count()
    s.close()
    if running >= plan['bot_slots']:
        return False, f"Plan {plan_name} allows {plan['bot_slots']} running bot slots (you have {running})"
    return True, 'ok'


def container_name_for_bot(bot_id):
    return f"botoralo_bot_{bot_id}"


def start_container_for_bot(bot):
    bdir = os.path.dirname(bot.code_path)
    # Docker requires an absolute path for volume mounts.
    absolute_bdir = os.path.abspath(bdir)
    name = container_name_for_bot(bot.id)
    mem_limit = f"{bot.memory_mb}m" if bot.memory_mb else None
    volumes = {absolute_bdir: {'bind': '/bot', 'mode': 'ro'}}
    cont = docker_client.containers.run(
        BOT_IMAGE,
        name=name,
        detach=True,
        mem_limit=mem_limit,
        network_mode='none',
        volumes=volumes,
        read_only=True,
        tty=False,
        auto_remove=True,
        stderr=True,
        stdout=True,
    )
    return cont


def stop_container_for_bot(bot):
    if not bot.container_id:
        return True
    try:
        cont = docker_client.containers.get(bot.container_id)
        cont.stop(timeout=5)
        return True
    except docker.errors.NotFound:
        return True
    except Exception:
        return False


def delete_container_for_bot(bot):
    if not bot.container_id:
        return True
    try:
        cont = docker_client.containers.get(bot.container_id)
        cont.remove(force=True)
        return True
    except docker.errors.NotFound:
        return True
    except Exception:
        return False


# --- API Endpoints ---

@app.route('/deploy', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId', 'name'])
def deploy_bot():
    """Deploy a bot record and save code. Expects multipart/form-data if uploading a file.
    Fields (JSON body or form.meta): userId, botoraloBotId, name, memory_mb (optional), auto_start (optional)
    If using multipart upload, provide file field 'code' and form field 'meta' containing JSON (userId etc.).
    """
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']
    name = data['name']
    memory_mb = int(data.get('memory_mb') or 0) or 128
    auto_start = bool(data.get('auto_start', False))

    ok, msg = check_plan_allows(user_id, memory_mb)
    if not ok:
        return jsonify({'error': msg}), 403

    # Save db record
    s = Session()
    bot = Bot(botoralo_bot_id=botoralo_bot_id, user_id=user_id, name=name, memory_mb=memory_mb, status='stopped', auto_restart=auto_start)
    s.add(bot); s.commit()

    # Save code file
    bot_dir = os.path.join(BOTS_DIR, str(bot.id))
    os.makedirs(bot_dir, exist_ok=True)

    code_path = os.path.join(bot_dir, 'code.py')
    # If file upload present, save it. Otherwise, expect 'code' in JSON body (as string).
    if 'code' in request.files:
        f = request.files['code']
        f.save(code_path)
    else:
        # take code field from JSON body
        code_text = data.get('code')
        if not code_text:
            s.delete(bot); s.commit(); s.close()
            return jsonify({'error': 'No code file uploaded and no code field provided'}), 400
        with open(code_path, 'w') as fh:
            fh.write(code_text)

    bot.code_path = code_path
    s.add(bot); s.commit()

    # Optionally start
    if auto_start:
        try:
            cont = start_container_for_bot(bot)
            bot.container_id = cont.id
            bot.status = 'running'
            bot.uptime_started_at = datetime.datetime.utcnow()
            s.add(bot); s.commit()
        except Exception as e:
            s.close()
            return jsonify({'error': 'failed to start container', 'details': str(e)}), 500

    info = {
        'id': bot.id,
        'botoraloBotId': bot.botoralo_bot_id,
        'name': bot.name,
        'memory_mb': bot.memory_mb,
        'status': bot.status,
        'created_at': bot.created_at.isoformat()
    }
    s.close()
    return jsonify({'bot': info}), 201


@app.route('/start', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def start_bot():
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']

    s = Session()
    bot = s.query(Bot).filter_by(user_id=user_id, botoralo_bot_id=botoralo_bot_id).first()
    if not bot:
        s.close(); return jsonify({'error': 'bot not found'}), 404

    ok, msg = check_plan_allows(user_id, bot.memory_mb)
    if not ok:
        s.close(); return jsonify({'error': msg}), 403

    try:
        cont = start_container_for_bot(bot)
        bot.container_id = cont.id
        bot.status = 'running'
        bot.uptime_started_at = datetime.datetime.utcnow()
        s.add(bot); s.commit(); s.close()
        return jsonify({'status': 'started', 'container_id': cont.id})
    except Exception as e:
        s.close(); return jsonify({'error': 'failed to start', 'details': str(e)}), 500


@app.route('/stop', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def stop_bot():
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']
    s = Session()
    bot = s.query(Bot).filter_by(user_id=user_id, botoralo_bot_id=botoralo_bot_id).first()
    if not bot:
        s.close(); return jsonify({'error': 'bot not found'}), 404
    ok = stop_container_for_bot(bot)
    if ok:
        bot.status = 'stopped'
        bot.uptime_started_at = None
        bot.container_id = None
        s.add(bot); s.commit(); s.close()
        return jsonify({'status': 'stopped'})
    s.close(); return jsonify({'error': 'failed to stop container'}), 500


@app.route('/delete', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def delete_bot():
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']
    s = Session()
    bot = s.query(Bot).filter_by(user_id=user_id, botoralo_bot_id=botoralo_bot_id).first()
    if not bot:
        s.close(); return jsonify({'error': 'bot not found'}), 404

    delete_container_for_bot(bot)
    # remove files
    try:
        import shutil
        if bot.code_path and os.path.exists(os.path.dirname(bot.code_path)):
            shutil.rmtree(os.path.dirname(bot.code_path), ignore_errors=True)
    except Exception:
        pass

    s.delete(bot); s.commit(); s.close()
    return jsonify({'status': 'deleted'})


@app.route('/info', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def info_bot():
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']
    s = Session()
    bot = s.query(Bot).filter_by(user_id=user_id, botoralo_bot_id=botoralo_bot_id).first()
    if not bot:
        s.close(); return jsonify({'error': 'bot not found'}), 404
    info = {
        'id': bot.id,
        'botoraloBotId': bot.botoralo_bot_id,
        'name': bot.name,
        'memory_mb': bot.memory_mb,
        'status': bot.status,
        'container_id': bot.container_id,
        'uptime_started_at': bot.uptime_started_at.isoformat() if bot.uptime_started_at else None,
        'created_at': bot.created_at.isoformat()
    }
    s.close(); return jsonify({'bot': info})


@app.route('/list', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId'])
def list_bots():
    user_id = request.data_json['userId']
    s = Session()
    bots = s.query(Bot).filter_by(user_id=user_id).all()
    out = []
    for b in bots:
        out.append({'id': b.id, 'botoraloBotId': b.botoralo_bot_id, 'name': b.name, 'status': b.status})
    s.close(); return jsonify({'bots': out})


@app.route('/logs', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def logs():
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']
    s = Session()
    bot = s.query(Bot).filter_by(user_id=user_id, botoralo_bot_id=botoralo_bot_id).first()
    if not bot:
        s.close(); return jsonify({'error': 'bot not found'}), 404
    if not bot.container_id:
        s.close(); return jsonify({'error': 'bot not running'}), 400

    def generate():
        try:
            cont = docker_client.containers.get(bot.container_id)
            for chunk in cont.logs(stream=True, follow=True, tail=100):
                yield f"data: {chunk.decode(errors='replace')}\n\n"
        except Exception as e:
            yield f"data: [error streaming logs] {str(e)}\n\n"

    s.close()
    return Response(stream_with_context(generate()), mimetype='text/event-stream')


@app.route('/stats', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def stats_bot():
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']
    s = Session()
    bot = s.query(Bot).filter_by(user_id=user_id, botoralo_bot_id=botoralo_bot_id).first()
    if not bot:
        s.close(); return jsonify({'error': 'bot not found'}), 404
    if not bot.container_id:
        s.close(); return jsonify({'cpu_usage': 0, 'memory_usage_mb': 0})

    try:
        cont = docker_client.containers.get(bot.container_id)
        stats = cont.stats(stream=False)
        
        # Memory usage calculation
        mem_usage = stats.get('memory_stats', {}).get('usage', 0)
        mem_limit = stats.get('memory_stats', {}).get('limit', 0)
        mem_usage_mb = round(mem_usage / (1024 * 1024), 2) if mem_usage else 0

        # CPU usage calculation
        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
        system_cpu_delta = stats['cpu_stats']['system_cpu_usage'] - stats['precpu_stats']['system_cpu_usage']
        number_cpus = stats['cpu_stats']['online_cpus']
        cpu_usage_percent = (cpu_delta / system_cpu_delta) * number_cpus * 100.0 if system_cpu_delta > 0 else 0
        
        s.close()
        return jsonify({'cpu_usage': round(cpu_usage_percent, 2), 'memory_usage_mb': mem_usage_mb})
    except docker.errors.NotFound:
        s.close(); return jsonify({'error': 'container not found, may have stopped'}), 404
    except Exception as e:
        s.close(); return jsonify({'error': 'failed to get stats', 'details': str(e)}), 500


@app.route('/download_code', methods=['POST'])
@require_master_key
@parse_json_body(required_fields=['userId', 'botoraloBotId'])
def download_code():
    data = request.data_json
    user_id = data['userId']
    botoralo_bot_id = data['botoraloBotId']
    s = Session()
    bot = s.query(Bot).filter_by(user_id=user_id, botoralo_bot_id=botoralo_bot_id).first()
    if not bot:
        s.close(); return jsonify({'error': 'bot not found'}), 404
    s.close()
    return send_file(bot.code_path, as_attachment=True)


# Healthcheck
@app.route('/_health')
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=False)

    
    

    

    