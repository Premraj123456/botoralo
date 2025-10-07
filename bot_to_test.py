
import time
import sys
import datetime

print("--- Test Bot Initializing ---")
print(f"Start time: {datetime.datetime.utcnow().isoformat()}Z")
# The flush() is crucial for ensuring logs appear in real-time in Docker.
sys.stdout.flush() 

count = 0
while True:
    count += 1
    print(f"Bot heartbeat {count}: The bot is alive and running...")
    sys.stdout.flush()
    time.sleep(2)
