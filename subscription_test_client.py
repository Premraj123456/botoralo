
import os
import requests
import json
from dotenv import load_dotenv

# --- Configuration ---
# Load environment variables from a .env file in the same directory
load_dotenv()

# Get backend URL and master key from environment variables
# Make sure these are set in your .env file
# NOTE: Use the Next.js app URL, not the bot backend URL
APP_URL = os.getenv('APP_URL', 'http://127.0.0.1:9002') 
MASTER_KEY = os.getenv('BOT_BACKEND_MASTER_KEY')

if not MASTER_KEY:
    print("\nCRITICAL ERROR: BOT_BACKEND_MASTER_KEY is not set in your .env file.")
    print("This script requires the master key to authenticate with the API.")
    exit(1)
    
if '9000-firebase-studio' in APP_URL:
    print("\nWARNING: Detected a Cloud Workstation URL.")
    print("Please ensure your workstation's 9002 port is made public for this script to connect.")
    print(f"Targeting: {APP_URL}\n")


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
    """Fetches subscription status for a given Supabase user ID."""

    print_step("Get Subscription Details")
    
    # Prompt for the user ID
    test_user_id = input("Enter the Supabase User ID to check: ").strip()
    if not test_user_id:
        print("User ID cannot be empty. Exiting.")
        return

    try:
        headers = {
            'Authorization': f'Bearer {MASTER_KEY}',
        }
        
        # Construct the request URL with query parameters
        url = f"{APP_URL}/api/subscription?userId={test_user_id}"
        
        print(f"\nSending GET request to: {url}")
        
        response = requests.get(url, headers=headers, timeout=20)
        
        print("\n--- Server Response ---")
        print_response(response)
        
        if response.ok:
            print("\n✅ TEST SUCCEEDED: Successfully retrieved subscription data.")
        else:
            print(f"\n❌ TEST FAILED: The API returned an error (Status: {response.status_code}).")


    except requests.exceptions.RequestException as e:
        print(f"\n❌ TEST FAILED: Could not connect to the application. {e}")
        print("Please ensure your Next.js application is running and accessible at the specified APP_URL.")
        return


if __name__ == '__main__':
    print("Starting Botoralo Subscription API Test...")
    print(f"Targeting app URL: {APP_URL}")
    run_test()
