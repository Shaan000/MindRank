#!/usr/bin/env python3
"""
Quick test to create matches directly via the backend API
"""

import requests
import json

def test_match_creation():
    print("🧪 Testing match creation via API...")
    
    # You'll need to replace this with your actual access token
    token = input("Enter your access token (from browser dev tools): ").strip()
    
    if not token:
        print("❌ Token required")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test connection first
    print("🔍 Testing connection...")
    try:
        response = requests.get('http://localhost:5000/me', headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Connected as: {user_data['user']['username']} (ELO: {user_data['user']['elo']})")
        else:
            print(f"❌ Connection failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return
    
    # Create sample matches
    print("🎯 Creating sample matches...")
    try:
        response = requests.post('http://localhost:5000/test/create-sample-matches', headers=headers)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data['message']}")
            print(f"📊 Created {data['matches_created']} matches")
        else:
            print(f"❌ Failed to create matches: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Error creating matches: {e}")
        return
    
    # Test fetching matches
    print("📋 Testing match retrieval...")
    try:
        response = requests.get('http://localhost:5000/user/matches?limit=10&order=desc', headers=headers)
        if response.status_code == 200:
            data = response.json()
            matches = data['matches']
            print(f"✅ Retrieved {len(matches)} matches")
            
            if matches:
                print("\n🏆 Most recent matches:")
                for i, match in enumerate(matches[:5]):
                    result = "WIN" if match['solved'] else "LOSS"
                    icon = "🏆" if match['solved'] else "💔"
                    elo_change = match['elo_after'] - match['elo_before']
                    print(f"  {i+1}. {icon} {result} - {match['mode']} ({elo_change:+d} ELO)")
            else:
                print("📊 No matches found")
        else:
            print(f"❌ Failed to fetch matches: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error fetching matches: {e}")

if __name__ == "__main__":
    test_match_creation() 