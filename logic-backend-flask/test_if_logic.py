#!/usr/bin/env python3
"""Test the improved IF-THEN logic in hard mode puzzles."""

import hard_mode
from z3 import *

def test_if_logic():
    print("🔍 Testing improved IF-THEN logic in hard mode...")
    print()
    
    # Generate several hard mode puzzles and check their IF statements
    for test_num in range(5):
        print(f"=== Test {test_num + 1} ===")
        try:
            puzzle = hard_mode.api_generate_hard(4)
            
            print(f"Generated puzzle with {puzzle['num_players']} players, {puzzle['num_truth_tellers']} truth-tellers")
            print("Solution:", puzzle['solution'])
            print()
            
            # Check each statement for logical consistency
            for speaker, statement_text in puzzle['statements'].items():
                print(f"{speaker}: \"{statement_text}\"")
                
                # Get the detailed statement data
                details = puzzle['full_statement_data'][speaker]
                speaker_role = puzzle['solution'][speaker]
                
                if details['mode'] == 'IF':
                    cond = details['cond']
                    cond_val = details['cond_val']
                    result = details['result']
                    result_val = details['result_val']
                    
                    # Get actual values from solution
                    cond_actual = puzzle['solution'][cond]
                    result_actual = puzzle['solution'][result]
                    
                    # Evaluate the implication
                    implication_value = (not cond_val) or result_val  # If cond_val, then result_val
                    
                    # Check consistency with actual values
                    cond_claim_correct = (cond_val == cond_actual)
                    result_claim_correct = (result_val == result_actual)
                    
                    print(f"  📊 Analysis:")
                    print(f"     Speaker is: {'Truth-Teller' if speaker_role else 'Liar'}")
                    print(f"     Condition: {cond} is {cond_val} (actually {cond_actual})")
                    print(f"     Result: {result} is {result_val} (actually {result_actual})")
                    print(f"     Implication evaluates to: {implication_value}")
                    
                    # Check if statement is consistent with speaker's role
                    if speaker_role:  # Truth-teller
                        if implication_value:
                            print(f"     ✅ Consistent: Truth-teller made TRUE statement")
                        else:
                            print(f"     ❌ Inconsistent: Truth-teller made FALSE statement")
                    else:  # Liar
                        if not implication_value:
                            print(f"     ✅ Consistent: Liar made FALSE statement")
                        else:
                            print(f"     ❌ Inconsistent: Liar made TRUE statement")
                
                print()
            
            # Verify with Z3 solver
            print("🧮 Verifying with Z3 solver...")
            verification_result = verify_puzzle_with_z3(puzzle)
            if verification_result:
                print("✅ Z3 verification passed!")
            else:
                print("❌ Z3 verification failed!")
            
            print()
            
        except Exception as e:
            print(f"❌ Test {test_num + 1} failed: {e}")
            print()

def verify_puzzle_with_z3(puzzle):
    """Verify puzzle consistency using Z3 solver."""
    people = list(puzzle['solution'].keys())
    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()
    
    # Add constraints from the puzzle
    for speaker, details in puzzle['full_statement_data'].items():
        if details['mode'] == 'IF':
            cond = details['cond']
            cond_val = details['cond_val']
            result = details['result']
            result_val = details['result_val']
            
            implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
            solver.add(Implies(z3_vars[speaker], implication))
            solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
        elif details['mode'] == 'DIRECT':
            target = details['target']
            claim = details['claim']
            solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
            solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != claim))
        elif details['mode'] == 'AND':
            t1, c1, t2, c2 = details['t1'], details['c1'], details['t2'], details['c2']
            solver.add(Implies(z3_vars[speaker], And(z3_vars[t1] == c1, z3_vars[t2] == c2)))
            solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[t1] != c1, z3_vars[t2] != c2)))
        elif details['mode'] == 'OR':
            t1, c1, t2, c2 = details['t1'], details['c1'], details['t2'], details['c2']
            solver.add(Implies(z3_vars[speaker], Or(z3_vars[t1] == c1, z3_vars[t2] == c2)))
            solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[t1] != c1, z3_vars[t2] != c2)))
    
    # Add truth-teller count constraint
    truth_count = Sum([If(z3_vars[p], 1, 0) for p in people])
    solver.add(truth_count == puzzle['num_truth_tellers'])
    
    # Add solution constraints
    for person, value in puzzle['solution'].items():
        solver.add(z3_vars[person] == value)
    
    return solver.check() == sat

if __name__ == "__main__":
    test_if_logic() 