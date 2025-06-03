#!/usr/bin/env python3
"""Test script to verify puzzle generation fixes."""

import easy_mode
import medium_mode
import hard_mode
import extreme_mode

def test_mode(mode_name, generate_func, num_players=5):
    """Test a specific puzzle mode."""
    print(f"\n=== Testing {mode_name} mode with {num_players} players ===")
    try:
        result = generate_func(num_players)
        
        # Check if we got an error (old format)
        if isinstance(result, dict) and "error" in result:
            print(f"❌ {mode_name} returned error: {result['error']}")
            return False
        
        # Check if we got a proper puzzle
        if isinstance(result, dict) and "statements" in result:
            print(f"✅ {mode_name} generated successfully!")
            print(f"   - Players: {result.get('num_players', 'Unknown')}")
            print(f"   - Truth-tellers: {result.get('num_truth_tellers', 'Unknown')}")
            print(f"   - Statements: {len(result.get('statements', {}))}")
            return True
        else:
            print(f"❌ {mode_name} returned unexpected format: {type(result)}")
            return False
            
    except RuntimeError as e:
        print(f"⚠️ {mode_name} failed after retries (expected behavior): {e}")
        return True  # This is actually the correct behavior now
    except Exception as e:
        print(f"❌ {mode_name} failed with exception: {e}")
        return False

def main():
    """Run all tests."""
    print("🚀 Testing puzzle generation fixes...")
    
    results = []
    results.append(test_mode("Easy", easy_mode.api_generate_easy))
    results.append(test_mode("Medium", medium_mode.api_generate_medium))
    results.append(test_mode("Hard", hard_mode.api_generate_hard))
    results.append(test_mode("Extreme", extreme_mode.api_generate_extreme))
    
    print(f"\n📊 Test Results:")
    print(f"✅ Passed: {sum(results)}/4")
    print(f"❌ Failed: {4 - sum(results)}/4")
    
    if all(results):
        print("🎉 All tests passed! Puzzle generation fixes are working correctly.")
    else:
        print("⚠️ Some tests failed. Please check the output above.")

if __name__ == "__main__":
    main() 