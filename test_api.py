import requests
import os

# Configuration
API_URL = "http://localhost:8000"
API_KEY = "c06b184d54534aa5b7790242fc9e156d" # Replace with your actual key

def test_root():
    print(f"Testing connectivity to {API_URL}...")
    try:
        response = requests.get(f"{API_URL}/")
        if response.status_code == 200:
            print("✅ API is online!")
            print(response.json())
        else:
            print(f"❌ API returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Could not connect to API: {e}")
        print("Make sure run 'uvicorn adsnap-studio.api:app --reload' in a separate terminal.")

def test_enhance_prompt():
    print("\nTesting /enhance-prompt...")
    payload = {
        "prompt": "cat in space",
        "api_key": API_KEY
    }
    try:
        response = requests.post(f"{API_URL}/enhance-prompt", data=payload)
        if response.status_code == 200:
            print("✅ Enhance Prompt Success!")
            print(response.json())
        else:
            print(f"❌ Enhance Prompt Failed: {response.text}")
    except Exception as e:
        print(f"❌ Request Error: {e}")

if __name__ == "__main__":
    test_root()
    # Uncomment the line below to test prompt enhancement if you have a valid key
    # test_enhance_prompt()
