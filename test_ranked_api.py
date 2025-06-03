#!/usr/bin/env python3
"""
Test script for the ranked puzzle generation API with hidden ELO system.
"""

import requests
import json

# Your access token
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6Inp2VGNOeklyWTJ3TzY5WVQiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM2NzMzOTQ4LCJpYXQiOjE3MzY3MzAzNDgsImlzcyI6Imh0dHBzOi8vc3d4cGp0d2NqbGJlZHBqYnZ0aHoudGVjaG5vbG9neS5zdXBhYmFzZS5jbyIsInN1YiI6IjAzZjJhMmRlLTMyOWQtNDU3Yy04ZTNjLWE1M2I3Y2QxNmZlYyIsImVtYWlsIjoiY2Fycm90c2hhYW5AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJZG1PRkF3QzNsZ2l3RTMzS2lLT0hUOGNsUXM1eU1zZlJLM0FQVnVZXzNWaWc9czk2LWMiLCJlbWFpbCI6ImNhcnJvdHNoYWFuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTaGFhbiBNYXJzdGVyIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IlNoYWFuIE1hcnN0ZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSWRtT0ZBd0MzbGdpd0UzM0tpS09IVDhjbFFzNXlNc2ZSSzNBUFZ1WV8zVmlnPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMDgzMzM4MDg5MDI4MTQ5NTUzMjciLCJzdWIiOiIxMDgzMzM4MDg5MDI4MTQ5NTUzMjcifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTczNjczMDM0OH1dLCJzZXNzaW9uX2lkIjoiNGE4MThlZDktZjAwMi00ZTRlLWIwN2ItMzZmODE1MTlkYTIzIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.ZVN-J-1N9qfUVYsV8sH_8QOEfHn7BVfcOOcJmtXOQbQ"

def test_ranked_puzzle_generation():
    """Test ranked puzzle generation for unranked users."""
    print("🧪 Testing Ranked Puzzle Generation API")
    print("=" * 40)
    
    url = "http://localhost:5000/puzzle/generate"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }
    data = {"mode": "ranked"}
    
    try:
        print("📡 Sending request to generate ranked puzzle...")
        response = requests.post(url, headers=headers, json=data, timeout=10)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            puzzle_data = response.json()
            print("✅ Puzzle generated successfully!")
            print(f"   Mode: {puzzle_data.get('mode', 'Unknown')}")
            print(f"   Players: {puzzle_data.get('num_players', 'Unknown')}")
            print(f"   Truth tellers: {puzzle_data.get('num_truth_tellers', 'Unknown')}")
            print(f"   Time limit: {puzzle_data.get('time_limit', 'Unknown')}s")
            print(f"   User ELO: {puzzle_data.get('user_elo', 'None (unranked)')}")
            print(f"   Hidden ELO: {puzzle_data.get('hidden_elo', 'None')}")
            print(f"   Is placement match: {puzzle_data.get('is_placement_match', 'Unknown')}")
            print(f"   Placement match number: {puzzle_data.get('placement_match_number', 'N/A')}")
            
            if puzzle_data.get('statements'):
                print(f"   Statements: {len(puzzle_data['statements'])} people")
                for person, statement in list(puzzle_data['statements'].items())[:2]:
                    print(f"     {person}: {statement[:50]}...")
            
            return puzzle_data
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ Request timed out - server may be processing")
        return None
    except requests.exceptions.ConnectionError:
        print("🔌 Connection error - is the Flask server running?")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def test_user_elo_endpoint():
    """Test the user ELO endpoint to see current status."""
    print("\n🧪 Testing User ELO Endpoint")
    print("=" * 30)
    
    url = "http://localhost:5000/user/elo"
    headers = {
        "Authorization": f"Bearer {ACCESS_TOKEN}"
    }
    
    try:
        print("📡 Fetching user ELO data...")
        response = requests.get(url, headers=headers, timeout=5)
        
        print(f"📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            elo_data = response.json()
            print("✅ ELO data retrieved successfully!")
            print(f"   ELO: {elo_data.get('elo', 'None (unranked)')}")
            print(f"   Tier: {elo_data.get('tier', 'Unknown')}")
            print(f"   Placement matches completed: {elo_data.get('placement_matches_completed', 0)}/5")
            print(f"   Is in placement: {elo_data.get('is_in_placement', 'Unknown')}")
            print(f"   Matches: {len(elo_data.get('matches', []))} found")
            
            return elo_data
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

if __name__ == "__main__":
    # Test user ELO status first
    elo_data = test_user_elo_endpoint()
    
    # Test ranked puzzle generation
    puzzle_data = test_ranked_puzzle_generation()
    
    if puzzle_data:
        print("\n🎉 SUCCESS: Ranked puzzle generation is working!")
        print("   The hidden ELO system is functioning correctly for unranked users.")
    else:
        print("\n❌ FAILED: Ranked puzzle generation is not working.")
        print("   Check the Flask server logs for more details.") 