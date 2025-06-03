#!/usr/bin/env python3
"""
Test script for the hidden ELO system for unranked users.
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'logic-backend-flask'))

from elo_system import (
    get_random_puzzle_config,
    get_random_puzzle_config_for_unranked,
    update_hidden_elo,
    reveal_placement_elo,
    get_tier,
    DEFAULT_HIDDEN_ELO
)

def test_unranked_puzzle_generation():
    """Test puzzle generation for unranked users."""
    print("🧪 Testing Hidden ELO System for Unranked Users")
    print("=" * 50)
    
    # Test 1: get_random_puzzle_config with None ELO (unranked user)
    print("\n1. Testing get_random_puzzle_config with None ELO:")
    mode, players = get_random_puzzle_config(None)
    print(f"   Result: {mode} with {players} players")
    
    # Test 2: get_random_puzzle_config_for_unranked with default hidden ELO
    print("\n2. Testing get_random_puzzle_config_for_unranked with default hidden ELO:")
    mode, players = get_random_puzzle_config_for_unranked()
    print(f"   Result: {mode} with {players} players")
    print(f"   Default hidden ELO: {DEFAULT_HIDDEN_ELO}")
    tier = get_tier(DEFAULT_HIDDEN_ELO)
    print(f"   Tier: {tier['label'] if tier else 'Unknown'}")
    
    # Test 3: Test hidden ELO updates during placement matches
    print("\n3. Testing hidden ELO updates during placement matches:")
    current_hidden_elo = DEFAULT_HIDDEN_ELO
    
    # Simulate 5 placement matches
    for match_num in range(1, 6):
        print(f"\n   Placement Match {match_num}/5:")
        print(f"   Current hidden ELO: {current_hidden_elo}")
        
        # Simulate solving the puzzle (win)
        if match_num <= 3:  # Win first 3 matches
            solved = True
            gave_up = False
            abandoned = False
            print(f"   Outcome: SOLVED ✅")
        elif match_num == 4:  # Give up on 4th match
            solved = False
            gave_up = True
            abandoned = False
            print(f"   Outcome: GAVE UP 🏳️")
        else:  # Get wrong answer on 5th match
            solved = False
            gave_up = False
            abandoned = False
            print(f"   Outcome: INCORRECT ❌")
        
        new_hidden_elo, elo_change, message = update_hidden_elo(
            current_hidden_elo, "Medium", 6, 90, solved, gave_up, abandoned
        )
        
        print(f"   {message}")
        print(f"   ELO change: {elo_change:+d}")
        print(f"   New hidden ELO: {new_hidden_elo}")
        
        current_hidden_elo = new_hidden_elo
    
    # Test 4: Reveal final ELO after placement matches
    print("\n4. Testing ELO revelation after placement matches:")
    final_elo = reveal_placement_elo(current_hidden_elo)
    print(f"   Final hidden ELO: {current_hidden_elo}")
    print(f"   Revealed ELO: {final_elo}")
    final_tier = get_tier(final_elo)
    print(f"   Final tier: {final_tier['label'] if final_tier else 'Unknown'}")
    
    # Test 5: Test puzzle generation with different hidden ELO values
    print("\n5. Testing puzzle generation with different hidden ELO values:")
    test_elos = [400, 750, 1200, 1600, 2100]
    
    for test_elo in test_elos:
        mode, players = get_random_puzzle_config_for_unranked(test_elo)
        tier = get_tier(test_elo)
        print(f"   Hidden ELO {test_elo}: {mode} with {players} players ({tier['label'] if tier else 'Unknown'})")

if __name__ == "__main__":
    test_unranked_puzzle_generation() 