
import os
import requests
import json
import uuid
import time
from dotenv import load_dotenv

# --- Configuration ---
# Load environment variables from a .env file in the same directory
load_dotenv()

# Get backend URL and master key from environment variables
# Make sure these are set in your .env file
BACKEND_URL = os.getenv('BOT_BACKEND_URL', 'http://127.0.0.1:5000')
MASTER_KEY = os.getenv('MASTER_BACKEND_KEY')

if not MASTER_KEY:
    print("CRITICAL ERROR: MASTER_BACKEND_KEY is not set in your .env file.")
    exit(1)

# --- Test Data ---
# Generate a unique bot ID for this test run to avoid conflicts
TEST_USER_ID = "test-user-123"
TEST_BOT_ID = str(uuid.uuid4())
TEST_BOT_NAME = "MyTestBot"
HEADERS = {
    'Authorization': f'Bearer {MASTER_KEY}',
}

# --- Helper Functions ---
def print_step(title):
    print("\n" + "="*50)
    print(f"STEP: {title}")
    print("="*50)

def print_response(response):
    try:
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except json.JSONDecodeError:
        print("Response (Not JSON):")
        print(response.text)

# --- Main Test Execution ---
def run_test():
    """Executes the full lifecycle test for a single bot."""

    # Create a dummy bot file to upload
    bot_code_content = """
import time
import sys

print("Hello from the test bot!")
sys.stdout.flush()
for i in range(10):
    print(f"Bot heartbeat {i+1}/10...")
    sys.stdout.flush()
    time.sleep(2)
print("Test bot finished its run.")
sys.stdout.flush()
"""
    
    # 1. DEPLOY THE BOT
    print_step("Deploying Bot")
    try:
        meta_data = {
            "userId": TEST_USER_ID,
            "botoraloBotId": TEST_BOT_ID,
            "name": TEST_BOT_NAME,
            "auto_start": True # Deploy and start immediately
        }
        files = {
            'meta': (None, json.dumps(meta_data), 'application/json'),
            'code': ('bot.py', bot_code_content, 'text/plain')
        }
        
        response = requests.post(f"{BACKEND_URL}/deploy", headers=HEADERS, files=files, timeout=30)
        print_response(response)
        response.raise_for_status()
        print("Waiting for bot to start and install dependencies (if any)...")
        time.sleep(15) # Give time for container to start, install, and restart
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not deploy bot. {e}")
        return

    # 2. GET BOT INFO
    print_step("Getting Bot Info (after deploy)")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/info", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not get bot info. {e}")

    # 3. GET BOT STATS
    print_step("Getting Bot Stats")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/stats", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not get bot stats. {e}")
        
    # 4. STREAM LOGS
    print_step("Streaming Logs for 5 seconds")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        with requests.post(f"{BACKEND_URL}/logs", headers=HEADERS, json=payload, stream=True, timeout=10) as r:
            start_time = time.time()
            for chunk in r.iter_content(chunk_size=None, decode_unicode=True):
                print(chunk.strip())
                if time.time() - start_time > 5:
                    break
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not stream logs. {e}")

    # Let the bot run for a bit longer
    print("\nLetting bot run for another 10 seconds...")
    time.sleep(10)
    
    # 5. STOP THE BOT
    print_step("Stopping Bot")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/stop", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
        time.sleep(5) # Give container time to stop
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not stop bot. {e}")

    # 6. GET BOT INFO (after stop)
    print_step("Getting Bot Info (after stop)")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/info", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not get bot info. {e}")

    # 7. START THE BOT AGAIN
    print_step("Starting Bot Again")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/start", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
        print("Waiting for bot to restart...")
        time.sleep(15) # Give time for container to start
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not start bot. {e}")

    # 8. GET BOT INFO (after restart)
    print_step("Getting Bot Info (after restart)")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/info", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not get bot info. {e}")
        
    # 9. DELETE THE BOT
    print_step("Deleting Bot")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/delete", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not delete bot. {e}")

    # 10. GET BOT INFO (after delete)
    print_step("Getting Bot Info (after delete)")
    try:
        payload = {"userId": TEST_USER_ID, "botoraloBotId": TEST_BOT_ID}
        response = requests.post(f"{BACKEND_URL}/info", headers=HEADERS, json=payload, timeout=10)
        print_response(response)
        print("\nTest finished. The final status should be 'stopped' or a 404-like error.")
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Could not get bot info. {e}")


if __name__ == '__main__':
    print("Starting Botoralo Backend API Test...")
    print(f"Targeting backend: {BACKEND_URL}")
    run_test()

    