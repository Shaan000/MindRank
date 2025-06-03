#!/usr/bin/env python3
"""
Test script for the dynamic time scaling system.
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'logic-backend-flask'))

from elo_system import calculate_dynamic_time_limit

def test_dynamic_time_scaling():
    """Test dynamic time scaling across different modes and player counts."""
    print("🧪 Testing Dynamic Time Scaling System")
    print("=" * 50)
    
    modes = ["Easy", "Medium", "Hard", "Extreme"]
    player_counts = [3, 4, 5, 6, 7, 8, 10, 12, 15]
    
    print("\n📊 Dynamic Time Limits by Mode and Player Count:")
    print("Players | Easy | Medium | Hard | Extreme")
    print("--------|------|--------|------|--------")
    
    for players in player_counts:
        times = []
        for mode in modes:
            time_limit = calculate_dynamic_time_limit(mode, players)
            times.append(f"{time_limit:3d}s")
        
        print(f"   {players:2d}   | {times[0]} |  {times[1]}  | {times[2]} |  {times[3]}")
    
    # Test specific scenarios
    print("\n🎯 Specific Test Cases:")
    
    test_cases = [
        ("Easy", 3, "Small Easy puzzle"),
        ("Easy", 6, "Standard Easy puzzle"),
        ("Medium", 5, "Base Medium puzzle"),
        ("Medium", 8, "Large Medium puzzle"),
        ("Hard", 6, "Standard Hard puzzle"),
        ("Hard", 8, "Large Hard puzzle"),
        ("Extreme", 12, "Standard Extreme puzzle"),
        ("Extreme", 15, "Large Extreme puzzle")
    ]
    
    for mode, players, description in test_cases:
        time_limit = calculate_dynamic_time_limit(mode, players)
        print(f"   {description}: {mode} with {players} players = {time_limit}s")
    
    # Show the scaling logic
    print("\n🔍 Scaling Logic:")
    print("   Base times (5 players): Easy=45s, Medium=75s, Hard=120s, Extreme=180s")
    print("   Each extra player: +15s")
    print("   Each missing player: -10s (minimum 20s)")
    
    # Test edge cases
    print("\n⚠️  Edge Cases:")
    extreme_cases = [
        ("Easy", 1, "Minimum players"),
        ("Hard", 20, "Maximum players"),
        ("Medium", 0, "Zero players (should handle gracefully)")
    ]
    
    for mode, players, description in extreme_cases:
        try:
            time_limit = calculate_dynamic_time_limit(mode, players)
            print(f"   {description}: {mode} with {players} players = {time_limit}s")
        except Exception as e:
            print(f"   {description}: ERROR - {e}")

if __name__ == "__main__":
    test_dynamic_time_scaling() 