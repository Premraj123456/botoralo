
import requests
import json
import uuid
import time

# --- Configuration ---
# IMPORTANT: Replace these with your actual backend URL and master key from your .env file.
BACKEND_URL = "http://34.122.143.227:5000"  # Make sure there is no trailing slash
MASTER_KEY = "UGvutgO87ETYV978ot8y7yRVP987YVP9C7843Y897Yp98y3V98Yq"
# -------------------

# This is the test code that will be "deployed" to your backend.
bot_code_to_deploy = """
import time
import sys

print("[info] Test bot started successfully!")
sys.stdout.flush()
time.sleep(10)
print("[info] Test bot finished.")
"""

# --- Test Runner ---

def make_request(endpoint, payload, method='POST', files=None):
    """Helper function to make requests to the backend."""
    url = f"{BACKEND_URL}{endpoint}"
    headers = {'Authorization': f'Bearer {MASTER_KEY}'}
    
    if not files:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(payload)
    else:
        data = None # requests will handle multipart data

    print(f"\n>>> Sending {method} request to {url}...")
    if payload:
        print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        response = requests.request(method, url, headers=headers, data=data, files=files, timeout=30)
        
        print(f"\n--- Response ---")
        print(f"Status Code: {response.status_code}")
        
        response_body = {}
        try:
            response_body = response.json()
            print("Body (JSON):")
            print(json.dumps(response_body, indent=2))
        except json.JSONDecodeError:
            print("Body (Text):")
            print(response.text)
        print("----------------\n")

        if not response.ok:
            print(f"❌  Request to {endpoint} FAILED.")
            return None, response_body
        
        print(f"✅  Request to {endpoint} SUCCEEDED.")
        return response.json(), None

    except requests.exceptions.RequestException as e:
        print(f"\n--- Request Error ---")
        print(f"An error occurred while trying to connect to the backend: {e}")
        print("---------------------\n")
        print("❌ Could not connect to the backend.")
        return None, {'error': str(e)}

def main():
    """Runs the full bot lifecycle test."""
    
    # Generate unique IDs for this test run
    user_id = f"test-user-{uuid.uuid4()}"
    botoralo_bot_id = f"test-bot-{uuid.uuid4()}"
    
    print("="*50)
    print(" STEP 1: DEPLOYING BOT")
    print("="*50)

    deploy_payload_meta = {
        'userId': user_id,
        'botoraloBotId': botoralo_bot_id,
        'name': 'Full Lifecycle Test Bot',
        'auto_start': True,
    }
    deploy_files = {
        'meta': (None, json.dumps(deploy_payload_meta), 'application/json'),
        'code': ('code.py', bot_code_to_deploy, 'text/plain'),
    }
    
    deploy_response, error = make_request('/deploy', deploy_payload_meta, files=deploy_files)
    
    if error:
        print("\n💥 TEST FAILED at deployment. Cannot continue.")
        return

    print("\nWaiting for 10 seconds for the bot to run and stop...")
    time.sleep(10)

    # --- STOP ---
    print("="*50)
    print(" STEP 2: STOPPING BOT")
    print("="*50)
    
    stop_payload = {'userId': user_id, 'botoraloBotId': botoralo_bot_id}
    stop_response, error = make_request('/stop', stop_payload)

    if error:
        print("\n💥 TEST FAILED at bot stop. Cannot continue.")
        return
        
    time.sleep(2) # Give a moment for the stop to process

    # --- START ---
    print("="*50)
    print(" STEP 3: RESTARTING BOT")
    print("="*50)

    start_payload = {'userId': user_id, 'botoraloBotId': botoralo_bot_id}
    start_response, error = make_request('/start', start_payload)

    if error:
        print("\n💥 TEST FAILED at bot start. Cannot continue.")
        return
        
    print("\nWaiting for 5 seconds...")
    time.sleep(5)

    # --- DELETE ---
    print("="*50)
    print(" STEP 4: DELETING BOT")
    print("="*50)
    
    delete_payload = {'userId': user_id, 'botoraloBotId': botoralo_bot_id}
    delete_response, error = make_request('/delete', delete_payload)
    
    if error:
        print("\n💥 TEST FAILED at bot deletion.")
        return

    print("\n🎉🎉🎉 Full lifecycle test completed successfully! 🎉🎉🎉")


if __name__ == "__main__":
    main()
