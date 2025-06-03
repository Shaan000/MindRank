def analyze_user_solution():
    """Analyze the user's specific puzzle and their proposed solution"""
    print("=== PUZZLE ANALYSIS ===")
    print("A says: 'If E is True, then D is False.'")
    print("B says: 'E is a Liar.'")
    print("C says: 'If E is True, then D is True.'") 
    print("D says: 'If E is True, then B is False.'")
    print("E says: 'A is a Liar.'")
    print()
    
    print("User's proposed solution: A:T B:T C:F D:T E:F")
    print()
    
    # User's solution
    A_truth = True   # Truth-teller
    B_truth = True   # Truth-teller  
    C_truth = False  # Liar
    D_truth = True   # Truth-teller
    E_truth = False  # Liar
    
    print("=== CHECKING EACH STATEMENT ===")
    
    # Statement 1: A says "If E is True, then D is False"
    print("1. A says: 'If E is True, then D is False.'")
    print(f"   A is a: {'Truth-teller' if A_truth else 'Liar'}")
    print(f"   E value: {E_truth}, D value: {D_truth}")
    if_then_result = (not E_truth) or (not D_truth)  # If E then not D
    print(f"   Statement evaluates to: {if_then_result}")
    print(f"   Expected from A: {A_truth}")
    print(f"   ✓ Consistent: {if_then_result == A_truth}")
    print()
    
    # Statement 2: B says "E is a Liar"
    print("2. B says: 'E is a Liar.'")
    print(f"   B is a: {'Truth-teller' if B_truth else 'Liar'}")
    print(f"   E is a: {'Truth-teller' if E_truth else 'Liar'}")
    statement_result = not E_truth  # E is a liar
    print(f"   Statement evaluates to: {statement_result}")
    print(f"   Expected from B: {B_truth}")
    print(f"   ✓ Consistent: {statement_result == B_truth}")
    print()
    
    # Statement 3: C says "If E is True, then D is True"
    print("3. C says: 'If E is True, then D is True.'")
    print(f"   C is a: {'Truth-teller' if C_truth else 'Liar'}")
    print(f"   E value: {E_truth}, D value: {D_truth}")
    if_then_result = (not E_truth) or D_truth  # If E then D
    print(f"   Statement evaluates to: {if_then_result}")
    print(f"   Expected from C: {C_truth}")
    print(f"   ✗ Consistent: {if_then_result == C_truth}")
    print("   *** CONTRADICTION! C is supposed to be a Liar but statement is True ***")
    print()
    
    # Statement 4: D says "If E is True, then B is False"
    print("4. D says: 'If E is True, then B is False.'")
    print(f"   D is a: {'Truth-teller' if D_truth else 'Liar'}")
    print(f"   E value: {E_truth}, B value: {B_truth}")
    if_then_result = (not E_truth) or (not B_truth)  # If E then not B
    print(f"   Statement evaluates to: {if_then_result}")
    print(f"   Expected from D: {D_truth}")
    print(f"   ✓ Consistent: {if_then_result == D_truth}")
    print()
    
    # Statement 5: E says "A is a Liar"
    print("5. E says: 'A is a Liar.'")
    print(f"   E is a: {'Truth-teller' if E_truth else 'Liar'}")
    print(f"   A is a: {'Truth-teller' if A_truth else 'Liar'}")
    statement_result = not A_truth  # A is a liar
    print(f"   Statement evaluates to: {statement_result}")
    print(f"   Expected from E: {E_truth}")
    print(f"   ✓ Consistent: {statement_result == E_truth}")
    print()

def find_correct_solution():
    """Find the correct solution using brute force"""
    print("=== FINDING CORRECT SOLUTION ===")
    
    solutions = []
    
    # Try all possible combinations
    for A in [True, False]:
        for B in [True, False]:
            for C in [True, False]:
                for D in [True, False]:
                    for E in [True, False]:
                        
                        # Check all statements
                        valid = True
                        
                        # A says "If E is True, then D is False"
                        stmt1 = (not E) or (not D)
                        if stmt1 != A:
                            valid = False
                            continue
                            
                        # B says "E is a Liar"
                        stmt2 = not E
                        if stmt2 != B:
                            valid = False
                            continue
                            
                        # C says "If E is True, then D is True"
                        stmt3 = (not E) or D
                        if stmt3 != C:
                            valid = False
                            continue
                            
                        # D says "If E is True, then B is False"
                        stmt4 = (not E) or (not B)
                        if stmt4 != D:
                            valid = False
                            continue
                            
                        # E says "A is a Liar"
                        stmt5 = not A
                        if stmt5 != E:
                            valid = False
                            continue
                            
                        if valid:
                            solutions.append((A, B, C, D, E))
    
    if solutions:
        print(f"Found {len(solutions)} valid solution(s):")
        for i, (A, B, C, D, E) in enumerate(solutions):
            print(f"Solution {i+1}: A:{A} B:{B} C:{C} D:{D} E:{E}")
            A_role = "Truth-teller" if A else "Liar"
            B_role = "Truth-teller" if B else "Liar"
            C_role = "Truth-teller" if C else "Liar"
            D_role = "Truth-teller" if D else "Liar"
            E_role = "Truth-teller" if E else "Liar"
            print(f"         A:{A_role} B:{B_role} C:{C_role} D:{D_role} E:{E_role}")
            print()
    else:
        print("No valid solutions found!")

def explain_if_then_confusion():
    """Explain the key confusion about if-then logic"""
    print("=== EXPLANATION OF THE CONFUSION ===")
    print()
    print("The key issue is understanding that 'If False, then X' is ALWAYS True!")
    print()
    print("In your analysis, you said:")
    print("'C says if false is true, then true is true - this is incorrect'")
    print()
    print("But this is wrong! Let's break it down:")
    print("- E is False (in your solution)")
    print("- D is True (in your solution)")
    print("- So C's statement is: 'If False, then True'")
    print("- This evaluates to: True")
    print()
    print("The confusion comes from thinking 'If False, then True' should be False.")
    print("But in logic, when the condition is False, the implication is automatically True!")
    print()
    print("Truth table for 'If P, then Q':")
    print("P=True,  Q=True  → True")
    print("P=True,  Q=False → False") 
    print("P=False, Q=True  → True   ← This is your case!")
    print("P=False, Q=False → True")
    print()
    print("Since C is supposed to be a Liar but their statement evaluates to True,")
    print("your solution creates a contradiction.")

if __name__ == "__main__":
    analyze_user_solution()
    print("\n" + "="*50 + "\n")
    find_correct_solution()
    print("\n" + "="*50 + "\n")
    explain_if_then_confusion() 