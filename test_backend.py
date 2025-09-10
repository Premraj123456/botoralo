
import requests
import json
import uuid

# --- Configuration ---
# IMPORTANT: Replace these with your actual backend URL and master key from your .env file.
BACKEND_URL = "http://34.122.143.227:5000"  # Make sure there is no trailing slash
MASTER_KEY = "UGvutgO87ETYV978ot8y7yRVP987YVP9C7843Y897Yp98y3V98Yq"
# -------------------

# This is the test code that will be "deployed" to your backend.
bot_code_to_deploy = """
import time
import sys
import random

print("[info] Test bot starting up successfully!")
sys.stdout.flush()
time.sleep(2)

counter = 0
while True:
    print(f"[info] Heartbeat count: {counter}")
    sys.stdout.flush()
    counter += 1
    time.sleep(3)
"""

def test_deploy():
    """
    Simulates a deployment request to the /deploy endpoint of your backend.
    """
    print(f"Attempting to deploy to {BACKEND_URL}/deploy...")

    # Prepare the multipart/form-data payload
    files = {
        'meta': (None, json.dumps({
            'userId': f"test-user-{uuid.uuid4()}",
            'botoraloBotId': f"test-bot-{uuid.uuid4()}",
            'name': 'Backend Test Bot',
            'auto_start': True,
        }), 'application/json'),
        'code': ('code.py', bot_code_to_deploy, 'text/plain'),
    }

    # Prepare the authentication header
    headers = {
        'Authorization': f'Bearer {MASTER_KEY}'
    }

    try:
        # Make the request
        response = requests.post(f"{BACKEND_URL}/deploy", files=files, headers=headers, timeout=30)

        # Print the results
        print(f"\n--- Response ---")
        print(f"Status Code: {response.status_code}")
        print("Headers:")
        for key, value in response.headers.items():
            print(f"  {key}: {value}")
        
        print("Body:")
        try:
            # Try to print JSON if possible, otherwise print raw text
            print(json.dumps(response.json(), indent=2))
        except json.JSONDecodeError:
            print(response.text)
        print("----------------\n")

        if response.ok:
            print("✅ Deployment request was successful!")
        else:
            print("❌ Deployment request failed. Check the response body above for the error from your backend.")

    except requests.exceptions.RequestException as e:
        print(f"\n--- Request Error ---")
        print(f"An error occurred while trying to connect to the backend: {e}")
        print("---------------------\n")
        print("❌ Could not connect to the backend. Please check:")
        print("1. Is your Flask backend running?")
        print("2. Is the BACKEND_URL in this script correct?")
        print("3. Is the backend accessible from where you are running this script?")


if __name__ == "__main__":
    test_deploy()
