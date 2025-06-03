#!/usr/bin/env python3
"""Test script for all puzzle mode modules."""

import sys
import traceback
from easy_mode import api_generate_easy, check_easy_solution
from medium_mode import api_generate_medium, check_medium_solution
from hard_mode import api_generate_hard, check_hard_solution
from extreme_mode import api_generate_extreme, check_extreme_solution

def test_mode(mode_name, generate_func, check_func, num_players=5):
    """Test a specific puzzle mode."""
    print(f"\n=== Testing {mode_name} mode with {num_players} players ===")
    
    try:
        # Generate a puzzle
        puzzle = generate_func(num_players)
        print(f"Generated puzzle successfully!")
        print(f"Players: {list(puzzle['solution'].keys())}")
        print(f"Truth-tellers: {puzzle['num_truth_tellers']}")
        print(f"Statements:")
        for person, statement in puzzle['statements'].items():
            print(f"  {person}: {statement}")
        
        # Test the correct solution
        test_data = {
            "statement_logic": puzzle["statement_logic"],
            "num_truth_tellers": puzzle["num_truth_tellers"],
            "guess": puzzle["solution"]
        }
        
        result = check_func(test_data)
        if result["valid"]:
            print("✓ Correct solution validated successfully!")
        else:
            print("✗ Correct solution failed validation!")
            return False
        
        # Test an incorrect solution (flip first person's value)
        first_person = list(puzzle["solution"].keys())[0]
        wrong_guess = puzzle["solution"].copy()
        wrong_guess[first_person] = not wrong_guess[first_person]
        
        test_data["guess"] = wrong_guess
        result = check_func(test_data)
        if not result["valid"]:
            print("✓ Incorrect solution correctly rejected!")
        else:
            print("✗ Incorrect solution was incorrectly accepted!")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Error in {mode_name} mode: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all tests."""
    print("Testing Truth-Teller/Liar Puzzle Modules")
    print("=" * 50)
    
    all_tests_passed = True
    
    # Test each mode
    modes = [
        ("Easy", api_generate_easy, check_easy_solution),
        ("Medium", api_generate_medium, check_medium_solution),
        ("Hard", api_generate_hard, check_hard_solution),
        ("Extreme", api_generate_extreme, check_extreme_solution)
    ]
    
    for mode_name, generate_func, check_func in modes:
        success = test_mode(mode_name, generate_func, check_func, num_players=5)
        if not success:
            all_tests_passed = False
    
    # Test with different player counts
    print(f"\n=== Testing different player counts ===")
    for num_players in [3, 4, 6, 8]:
        print(f"\nTesting with {num_players} players:")
        success = test_mode("Easy", api_generate_easy, check_easy_solution, num_players)
        if not success:
            all_tests_passed = False
    
    print(f"\n{'='*50}")
    if all_tests_passed:
        print("🎉 All tests passed! The puzzle modules are working correctly.")
    else:
        print("❌ Some tests failed. Please check the implementation.")
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    sys.exit(main()) 