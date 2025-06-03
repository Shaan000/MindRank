#!/usr/bin/env python3
"""
Test script for the leaderboard endpoint.
"""

import requests
import json

def test_leaderboard():
    """Test the leaderboard endpoint."""
    print("🧪 Testing Leaderboard Endpoint")
    print("=" * 40)
    
    try:
        print("📞 Making request to http://localhost:5000/leaderboard...")
        response = requests.get('http://localhost:5000/leaderboard', timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            leaderboard = data.get('leaderboard', [])
            
            print(f"✅ Success! Leaderboard has {len(leaderboard)} ranked users")
            
            if leaderboard:
                print("\n🏆 Top 5 Users:")
                for i, user in enumerate(leaderboard[:5]):
                    print(f"  {user['rank']}. {user['username']} - {user['elo']} ELO ({user['tier']})")
            else:
                print("📭 No ranked users found (this is expected if no one has completed placement matches)")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out")
    except requests.exceptions.ConnectionError:
        print("🔌 Connection error - is the Flask server running?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_leaderboard() 