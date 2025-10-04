
import os
import requests
import json
import uuid
import time
import hmac
import hashlib
from dotenv import load_dotenv

# --- Configuration ---
# Load environment variables from a .env file in the same directory
load_dotenv()

# --- Script Setup ---
# Get configuration from environment variables
# Make sure these are set in your .env file
# NEXT_PUBLIC_PADDLE_PRO_PLAN_ID is used as an example price_id
# PADDLE_WEBHOOK_SECRET is used to sign the request
APP_URL = os.getenv('APP_URL', 'http://127.0.0.1:9002')
WEBHOOK_SECRET = os.getenv('PADDLE_WEBHOOK_SECRET')
PRO_PLAN_PRICE_ID = os.getenv('NEXT_PUBLIC_PADDLE_PRO_PLAN_ID')

# --- Helper Functions ---

def print_step(title):
    """Prints a formatted step title."""
    print("\n" + "="*60)
    print(f"STEP: {title}")
    print("="*60)

def print_response(response):
    """Prints the status code and JSON response from the server."""
    print(f"\n--- Server Response ---")
    print(f"Status Code: {response.status_code}")
    try:
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
    except json.JSONDecodeError:
        print("Response (Not JSON):")
        print(response.text)
    print("-----------------------")

def generate_paddle_signature(webhook_secret: str, timestamp: str, request_body: str) -> str:
    """
    Generates the signature required by Paddle for webhook validation.
    See: https://developer.paddle.com/webhooks/signature-verification
    """
    if not webhook_secret:
        raise ValueError("Webhook secret is not set. Cannot generate signature.")
    
    # The h-mac key is the webhook secret
    key = webhook_secret.encode('utf-8')
    
    # The message is composed of the timestamp, a colon, and the request body
    message = f"{timestamp}:{request_body}".encode('utf-8')
    
    # The signature is a hex-encoded hmac-sha256 hash
    signature = hmac.new(key, message, hashlib.sha256).hexdigest()
    
    return f"ts={timestamp};h1={signature}"


# --- Main Test Execution ---

def run_test():
    """Executes a test to simulate a Paddle subscription activation webhook."""

    if not WEBHOOK_SECRET:
        print("\nCRITICAL ERROR: PADDLE_WEBHOOK_SECRET is not set in your .env file.")
        print("This secret is required to sign the webhook request.")
        return

    if not PRO_PLAN_PRICE_ID:
        print("\nWARNING: NEXT_PUBLIC_PADDLE_PRO_PLAN_ID is not set in your .env file.")
        print("Using a placeholder 'price_12345' for the test.")
        price_id_to_use = "price_12345"
    else:
        price_id_to_use = PRO_PLAN_PRICE_ID

    # 1. Generate unique data for this test run
    print_step("Generating Test Data")
    test_user_id = str(uuid.uuid4())
    test_subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
    test_customer_id = f"ctm_{uuid.uuid4().hex[:12]}"
    
    print(f"Generated Test User ID (Supabase auth.users.id): {test_user_id}")
    print("This user ID should appear in your 'profiles' table after the test.")


    # 2. Construct the mock Paddle webhook payload
    print_step("Constructing Mock Paddle Webhook Payload")
    payload = {
        "event_type": "subscription.activated",
        "data": {
            "id": test_subscription_id,
            "customer_id": test_customer_id,
            "status": "active",
            "customData": {
                "user_id": test_user_id
            },
            "items": [
                {
                    "price": {
                        "id": price_id_to_use,
                        "type": "recurring"
                    },
                    "quantity": 1
                }
            ]
        }
    }
    payload_str = json.dumps(payload, separators=(',', ':')) # Compact JSON string
    print("Payload to be sent:")
    print(json.dumps(payload, indent=2))

    # 3. Generate the signature header
    print_step("Generating Paddle Signature")
    timestamp = str(int(time.time()))
    try:
        signature = generate_paddle_signature(WEBHOOK_SECRET, timestamp, payload_str)
        headers = {
            'Content-Type': 'application/json',
            'Paddle-Signature': signature
        }
        print("Signature generated successfully.")
    except ValueError as e:
        print(f"\nERROR: {e}")
        return

    # 4. Send the request to the application's webhook endpoint
    print_step("Sending POST Request to Webhook Endpoint")
    webhook_url = f"{APP_URL}/api/paddle/webhook"
    print(f"Target URL: {webhook_url}")
    
    try:
        response = requests.post(webhook_url, headers=headers, data=payload_str, timeout=15)
        print_response(response)

        # 5. Provide next steps
        if response.ok:
            print("\n✅ TEST SUCCEEDED: The webhook endpoint returned a successful status code.")
            print("\n--- NEXT STEPS ---")
            print("1. Go to your Supabase project.")
            print("2. Open the Table Editor and select the 'profiles' table.")
            print(f"3. Look for a new row where the 'id' column matches the Test User ID: {test_user_id}")
            print("4. Verify that the 'plan' column for that row is set to 'Pro'.")
        else:
            print("\n❌ TEST FAILED: The webhook endpoint returned an error.")
            print("Check your Next.js application logs for more details on the error.")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ TEST FAILED: Could not connect to the application.")
        print(f"Error: {e}")
        print("\nPlease ensure your Next.js application is running and accessible at the specified APP_URL.")


if __name__ == '__main__':
    print("Starting Paddle Webhook Tester...")
    run_test()
