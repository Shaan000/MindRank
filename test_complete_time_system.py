#!/usr/bin/env python3
"""
Comprehensive test showing dynamic time scaling with tier system and hidden ELO.
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'logic-backend-flask'))

from elo_system import (
    get_random_puzzle_config,
    get_random_puzzle_config_for_unranked,
    calculate_dynamic_time_limit,
    get_tier,
    DEFAULT_HIDDEN_ELO
)

def test_complete_time_system():
    """Test the complete time scaling system with hidden ELO and tiers."""
    print("🧪 Testing Complete Dynamic Time System")
    print("=" * 55)
    
    # Test different ELO levels (unranked users with various hidden ELOs)
    test_elos = [
        (400, "Beginner"),
        (750, "Intermediate (Default)"), 
        (1200, "Advanced"),
        (1600, "Critical"),
        (2100, "Grandmaster")
    ]
    
    print("\n🎯 Unranked User Puzzle Generation with Dynamic Time Scaling:")
    print("=" * 55)
    
    for hidden_elo, description in test_elos:
        print(f"\n📊 {description} - Hidden ELO: {hidden_elo}")
        tier = get_tier(hidden_elo)
        print(f"   Tier: {tier['label']}")
        print(f"   Available modes: {list(tier['allowed_modes'].keys())}")
        
        # Generate 3 sample puzzles for this ELO level
        for i in range(3):
            mode, players = get_random_puzzle_config_for_unranked(hidden_elo)
            time_limit = calculate_dynamic_time_limit(mode, players)
            print(f"   Sample {i+1}: {mode} with {players} players → {time_limit}s")
    
    # Test how time scales within each mode
    print(f"\n⏱️  Time Scaling Examples:")
    print("=" * 30)
    
    scaling_examples = [
        ("Easy", [3, 4, 5, 6, 7]),
        ("Medium", [6, 7, 8, 9, 10]),
        ("Hard", [6, 7, 8, 9, 10]),
        ("Extreme", [12, 13, 14, 15, 16])
    ]
    
    for mode, player_counts in scaling_examples:
        print(f"\n{mode} Mode Time Scaling:")
        for players in player_counts:
            time_limit = calculate_dynamic_time_limit(mode, players)
            base_time = calculate_dynamic_time_limit(mode, 5)
            if players == 5:
                print(f"  {players} players: {time_limit}s (base)")
            elif players < 5:
                saved = base_time - time_limit
                print(f"  {players} players: {time_limit}s (-{saved}s)")
            else:
                extra = time_limit - base_time
                print(f"  {players} players: {time_limit}s (+{extra}s)")
    
    # Show realistic gameplay scenarios
    print(f"\n🎮 Realistic Gameplay Scenarios:")
    print("=" * 35)
    
    scenarios = [
        ("New player (first puzzle)", 750, "Medium", 6, "Starting with intermediate difficulty"),
        ("Improving player", 900, "Medium", 8, "Slightly harder puzzle as skills improve"),
        ("Advanced player", 1200, "Hard", 6, "Complex logic puzzles"),
        ("Expert player", 1800, "Hard", 10, "Very challenging puzzles"),
        ("Grandmaster player", 2200, "Extreme", 15, "Maximum difficulty puzzles")
    ]
    
    for scenario, elo, mode, players, description in scenarios:
        time_limit = calculate_dynamic_time_limit(mode, players)
        tier = get_tier(elo)
        print(f"\n{scenario}:")
        print(f"   ELO: {elo} ({tier['label']})")
        print(f"   Puzzle: {mode} with {players} players")
        print(f"   Time limit: {time_limit}s ({time_limit/60:.1f} minutes)")
        print(f"   Context: {description}")
    
    # Show the fairness of the system
    print(f"\n⚖️  System Fairness Analysis:")
    print("=" * 30)
    
    print("✅ Time scales linearly with complexity:")
    print("   - More players = more statements to read")
    print("   - +15s per extra player is reasonable")
    print("   - -10s per missing player prevents abuse")
    
    print("\n✅ Mode-appropriate base times:")
    print("   - Easy (45s): Quick direct statements")
    print("   - Medium (75s): AND/OR logic requires more thought")
    print("   - Hard (120s): Complex conditionals need time")
    print("   - Extreme (180s): Multi-layered logic is complex")
    
    print("\n✅ Realistic time ranges:")
    for mode in ["Easy", "Medium", "Hard", "Extreme"]:
        min_time = calculate_dynamic_time_limit(mode, 3)
        max_time = calculate_dynamic_time_limit(mode, 15)
        print(f"   - {mode}: {min_time}s - {max_time}s ({min_time//60}:{min_time%60:02d} - {max_time//60}:{max_time%60:02d})")

if __name__ == "__main__":
    test_complete_time_system() 