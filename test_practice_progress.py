#!/usr/bin/env python3
"""
Test script for the practice progress tracking system.
"""

import requests
import json

# Your access token (you'll need to update this)
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6Inp2VGNOeklyWTJ3TzY5WVQiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM2NzMzOTQ4LCJpYXQiOjE3MzY3MzAzNDgsImlzcyI6Imh0dHBzOi8vc3d4cGp0d2NqbGJlZHBqYnZ0aHoudGVjaG5vbG9neS5zdXBhYmFzZS5jbyIsInN1YiI6IjAzZjJhMmRlLTMyOWQtNDU3Yy04ZTNjLWE1M2I3Y2QxNmZlYyIsImVtYWlsIjoiY2Fycm90c2hhYW5AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJZG1PRkF3QzNsZ2l3RTMzS2lLT0hUOGNsUXM1eU1zZlJLM0FQVnVZXzNWaWc9czk2LWMiLCJlbWFpbCI6ImNhcnJvdHNoYWFuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTaGFhbiBNYXJzdGVyIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IlNoYWFuIE1hcnN0ZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSWRtT0ZBd0MzbGdpd0UzM0tpS09IVDhjbFFzNXlNc2ZSSzNBUFZ1WV8zVmlnPXM5Ni1jIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lkbU9GQXdDM2xnaXdFMzNLaUtPSFQ4Y2xRczV5TXNmUkszQVBWdVlfM1ZpZz1zOTYtYyIsInN1YiI6IjAzZjJhMmRlLTMyOWQtNDU3Yy04ZTNjLWE1M2I3Y2QxNmZlYyJ9fQ"

def test_practice_progress_endpoint():
    """Test the practice progress endpoint."""
    print("🧪 Testing Practice Progress Endpoint")
    print("=" * 45)
    
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    
    try:
        print("📞 Getting practice progress...")
        response = requests.get('http://localhost:5000/user/practice-progress', headers=headers, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            progress = data.get('practice_progress', {})
            
            print("✅ Practice Progress Retrieved!")
            print("\n📈 Current Progress:")
            
            for mode, data in progress.items():
                if data['unlocked']:
                    status = "🔓 UNLOCKED"
                    progress_bar = "█" * int(data['percentage'] / 10) + "░" * (10 - int(data['percentage'] / 10))
                    completion = " ✅ COMPLETED" if data['completed'] else ""
                    
                    print(f"  {mode.upper():8} {status}{completion}")
                    print(f"    Progress: [{progress_bar}] {data['solved']}/{data['total']} ({data['percentage']:.1f}%)")
                else:
                    status = "🔒 LOCKED"
                    print(f"  {mode.upper():8} {status}")
                    print(f"    Complete previous mode to unlock")
                print()  # Empty line for spacing
                
        elif response.status_code == 401:
            print("❌ Authentication failed - token may be expired")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out")
    except requests.exceptions.ConnectionError:
        print("🔌 Connection error - is the Flask server running?")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_easy_puzzle_generation():
    """Test generating an easy puzzle to see practice progress info."""
    print("🧪 Testing Easy Puzzle Generation with Progress")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
    
    try:
        print("📞 Generating easy puzzle...")
        response = requests.post('http://localhost:5000/puzzle/generate', 
                               headers=headers, 
                               json={"mode": "easy", "players": 4}, 
                               timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if practice progress is included
            if "practice_progress" in data:
                progress = data["practice_progress"]
                progress_bar = "█" * int(progress['percentage'] / 10) + "░" * (10 - int(progress['percentage'] / 10))
                
                print(f"✅ Practice progress included!")
                print(f"   Mode: {progress['mode'].upper()}")
                print(f"   Progress: [{progress_bar}] {progress['solved']}/{progress['total']} ({progress['percentage']:.1f}%)")
            else:
                print("⚠️ No practice progress in response")
                
            # Check if mode unlock status is included
            if "mode_unlocked" in data:
                status = "🔓 UNLOCKED" if data["mode_unlocked"] else "🔒 LOCKED"
                print(f"   Status: {status}")
            
            print(f"   Players: {data.get('num_players', 'N/A')}")
            print(f"   Time limit: {data.get('time_limit', 'N/A')}s")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_practice_progress_endpoint()
    test_easy_puzzle_generation() 