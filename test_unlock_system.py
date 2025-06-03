#!/usr/bin/env python3
"""
Test script to simulate solving puzzles and verify unlock progression.
"""

import requests
import json

# Your access token (you'll need to update this with a fresh one)
ACCESS_TOKEN = "YOUR_FRESH_TOKEN_HERE"

def simulate_puzzle_solve(mode, num_puzzles=1):
    """Simulate solving puzzles by directly updating the database."""
    print(f"🎮 Simulating solving {num_puzzles} {mode} puzzle(s)...")
    
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}", "Content-Type": "application/json"}
    
    # This would normally be done through actual puzzle solving, but for testing
    # we can create a test endpoint or manually update the database
    
    # For now, let's just check the current progress
    try:
        response = requests.get('http://localhost:5000/user/practice-progress', headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            progress = data.get('practice_progress', {})
            mode_data = progress.get(mode, {})
            
            print(f"   Current {mode} progress: {mode_data.get('solved', 0)}/10")
            print(f"   Unlocked: {'✅' if mode_data.get('unlocked', False) else '❌'}")
            
            if mode_data.get('completed', False):
                print(f"   🎉 {mode.upper()} MODE COMPLETED!")
                
            return mode_data
        else:
            print(f"   ❌ Failed to get progress: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def check_unlock_progression():
    """Check the unlock progression system."""
    print("🧪 Testing Unlock Progression System")
    print("=" * 50)
    
    print("📊 Checking initial state...")
    easy_data = simulate_puzzle_solve("easy", 0)
    
    if easy_data:
        print("\n🎯 Testing unlock logic:")
        
        # Check easy mode (always unlocked)
        print(f"✅ Easy mode: {'🔓 Unlocked' if easy_data.get('unlocked') else '🔒 Locked'}")
        
        # Check medium mode unlock
        easy_completed = easy_data.get('solved', 0) >= 10
        print(f"{'✅' if easy_completed else '❌'} Medium unlock: Easy completed = {easy_completed}")
        
        # Get medium data
        medium_data = simulate_puzzle_solve("medium", 0)
        if medium_data:
            medium_unlocked = medium_data.get('unlocked', False)
            print(f"{'✅' if medium_unlocked else '❌'} Medium mode: {'🔓 Unlocked' if medium_unlocked else '🔒 Locked'}")
            
            # Check hard mode unlock
            medium_completed = medium_data.get('solved', 0) >= 10
            print(f"{'✅' if medium_completed else '❌'} Hard unlock: Medium completed = {medium_completed}")
            
            # Get hard data
            hard_data = simulate_puzzle_solve("hard", 0)
            if hard_data:
                hard_unlocked = hard_data.get('unlocked', False)
                print(f"{'✅' if hard_unlocked else '❌'} Hard mode: {'🔓 Unlocked' if hard_unlocked else '🔒 Locked'}")
                
                # Check extreme mode unlock
                hard_completed = hard_data.get('solved', 0) >= 10
                print(f"{'✅' if hard_completed else '❌'} Extreme unlock: Hard completed = {hard_completed}")
                
                # Get extreme data
                extreme_data = simulate_puzzle_solve("extreme", 0)
                if extreme_data:
                    extreme_unlocked = extreme_data.get('unlocked', False)
                    print(f"{'✅' if extreme_unlocked else '❌'} Extreme mode: {'🔓 Unlocked' if extreme_unlocked else '🔒 Locked'}")

def show_progress_bars():
    """Display progress bars for all modes."""
    print("\n📈 Current Progress Bars:")
    print("=" * 30)
    
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    
    try:
        response = requests.get('http://localhost:5000/user/practice-progress', headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            progress = data.get('practice_progress', {})
            
            for mode, data in progress.items():
                if data['unlocked']:
                    progress_bar = "█" * int(data['percentage'] / 10) + "░" * (10 - int(data['percentage'] / 10))
                    completion = " ✅ COMPLETED" if data['completed'] else ""
                    
                    print(f"{mode.upper():8} 🔓{completion}")
                    print(f"         [{progress_bar}] {data['solved']}/10 ({data['percentage']:.1f}%)")
                else:
                    print(f"{mode.upper():8} 🔒 Complete previous mode to unlock")
                print()
                
        elif response.status_code == 401:
            print("❌ Authentication failed - token may be expired")
            print("   Please update ACCESS_TOKEN with a fresh token")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if ACCESS_TOKEN == "YOUR_FRESH_TOKEN_HERE":
        print("⚠️  Please update ACCESS_TOKEN in this script with a fresh token!")
        print("   You can get a fresh token by logging into your app and checking the network tab.")
    else:
        check_unlock_progression()
        show_progress_bars() 