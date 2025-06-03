#!/usr/bin/env python3
"""
Test script for first-try progress tracking.
This tests that progress is only tracked for first-try successes.
"""

import requests
import json

# Your access token (update with fresh one for testing)
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6Inp2VGNOeklyWTJ3TzY5WVQiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM2NzMzOTQ4LCJpYXQiOjE3MzY3MzAzNDgsImlzcyI6Imh0dHBzOi8vc3d4cGp0d2NqbGJlZHBqYnZ0aHoudGVjaG5vbG9neS5zdXBhYmFzZS5jbyIsInN1YiI6IjAzZjJhMmRlLTMyOWQtNDU3Yy04ZTNjLWE1M2I3Y2QxNmZlYyIsImVtYWlsIjoiY2Fycm90c2hhYW5AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJZG1PRkF3QzNsZ2l3RTMzS2lLT0hUOGNsUXM1eU1zZlJKeTJoUzlON1U9czk2LWMiLCJlbWFpbCI6ImNhcnJvdHNoYWFuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTaGFhbiBHaGF5dXIiLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYW1lIjoiU2hhYW4gR2hheXVyIiwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSWRtT0ZBd0MzbGdpd0UzM0tpS09IVDhjbFFzNXlNc2ZSSnkyaFM5TjdVPXM5Ni1jIiwicHJvdmlkZXJfaWQiOiIxMDg5Mzg5NDg3Mjk1NDg3ODgwNzAiLCJzdWIiOiIxMDg5Mzg5NDg3Mjk1NDg3ODgwNzAifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvYXV0aCIsInRpbWVzdGFtcCI6MTczNjczMDM0OH1dLCJzZXNzaW9uX2lkIjoiYTQ4YzJlMWMtNmYwNi00YWM5LWE2MTUtMTdmNjgzMjBhNzk5IiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.w9VYVsL1kd6bDK6v2T3NqJmX2OjN67gAyDSWk-_HrGw"

def test_first_try_progress():
    """Test the first-try progress tracking system."""
    print("🧪 Testing First-Try Progress Tracking")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    
    try:
        # Get initial progress
        print("📊 Getting initial progress...")
        progress_response = requests.get('http://localhost:5000/practice/progress-bars', headers=headers, timeout=10)
        
        if progress_response.ok:
            initial_progress = progress_response.json()
            print(f"✅ Initial progress: {json.dumps(initial_progress, indent=2)}")
            
            # Find easy mode progress
            easy_progress = None
            for progress in initial_progress.get('progress_bars', []):
                if progress['mode'] == 'easy':
                    easy_progress = progress
                    break
            
            initial_easy_count = easy_progress['solved'] if easy_progress else 0
            print(f"📈 Initial Easy mode count: {initial_easy_count}/10")
            
        else:
            print(f"❌ Failed to get initial progress: {progress_response.status_code}")
            return
        
        # Generate a practice puzzle
        print("\n🎲 Generating Easy mode puzzle...")
        puzzle_response = requests.post('http://localhost:5000/puzzle/generate', 
                                       json={"mode": "easy", "players": 4}, 
                                       headers=headers, timeout=10)
        
        if not puzzle_response.ok:
            print(f"❌ Failed to generate puzzle: {puzzle_response.status_code}")
            return
            
        puzzle = puzzle_response.json()
        print(f"✅ Generated puzzle with {len(puzzle.get('statement_data', {}))} statements")
        
        # Test 1: First attempt (correct) - should count
        print("\n🎯 Test 1: First attempt (correct) - should count towards progress")
        correct_guess = {"A": True, "B": False, "C": True, "D": False}  # Mock correct answer
        
        check_data = {
            "mode": "easy",
            "player_assignments": correct_guess,
            "statement_data": puzzle.get("statement_data", {}),
            "num_truth_tellers": puzzle.get("num_truth_tellers", 2),
            "is_first_attempt": True  # This is the key field
        }
        
        check_response = requests.post('http://localhost:5000/puzzle/check', 
                                     json=check_data, 
                                     headers=headers, timeout=10)
        
        if check_response.ok:
            result = check_response.json()
            print(f"✅ First attempt result: {result.get('valid', False)}")
            if 'practice_progress' in result:
                print(f"📈 Progress updated: {result['practice_progress']}")
            else:
                print("ℹ️ No progress update (might be wrong answer or already at 10)")
        else:
            print(f"❌ First attempt failed: {check_response.status_code}")
            
        # Test 2: Second attempt (correct) - should NOT count
        print("\n🔄 Test 2: Second attempt (correct) - should NOT count towards progress")
        
        check_data["is_first_attempt"] = False  # Not first attempt
        
        check_response2 = requests.post('http://localhost:5000/puzzle/check', 
                                      json=check_data, 
                                      headers=headers, timeout=10)
        
        if check_response2.ok:
            result2 = check_response2.json()
            print(f"✅ Second attempt result: {result2.get('valid', False)}")
            if 'practice_progress' in result2:
                print(f"📈 Progress updated: {result2['practice_progress']} (This shouldn't happen!)")
            else:
                print("✅ No progress update (correct - not first attempt)")
        else:
            print(f"❌ Second attempt failed: {check_response2.status_code}")
            
        # Get final progress to confirm
        print("\n📊 Getting final progress...")
        final_progress_response = requests.get('http://localhost:5000/practice/progress-bars', headers=headers, timeout=10)
        
        if final_progress_response.ok:
            final_progress = final_progress_response.json()
            
            # Find easy mode progress
            final_easy_progress = None
            for progress in final_progress.get('progress_bars', []):
                if progress['mode'] == 'easy':
                    final_easy_progress = progress
                    break
            
            final_easy_count = final_easy_progress['solved'] if final_easy_progress else 0
            print(f"📈 Final Easy mode count: {final_easy_count}/10")
            
            if final_easy_count > initial_easy_count:
                print("✅ SUCCESS! Progress increased by first-try success")
            else:
                print("ℹ️ No progress increase (puzzle was wrong or user already at 10)")
                
        else:
            print(f"❌ Failed to get final progress: {final_progress_response.status_code}")
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")

if __name__ == "__main__":
    test_first_try_progress() 