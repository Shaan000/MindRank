#!/usr/bin/env python3
"""Step-by-step analysis of the user's IF-THEN puzzle."""

from z3 import *

def analyze_user_puzzle():
    print("🔍 STEP-BY-STEP ANALYSIS OF YOUR PUZZLE")
    print("=" * 50)
    print()
    
    print("📝 The Puzzle:")
    print('A says: "If D is True, then B is True."')
    print('B says: "D is a Liar OR C is a Liar."')
    print('C says: "If B is False, then A is False."')
    print('D says: "C is a Truth-Teller OR B is a Liar."')
    print()
    print("Your guess: A:T, B:T, C:F, D:F")
    print()
    
    # User's proposed solution
    A, B, C, D = True, True, False, False
    
    print("🔍 CHECKING EACH STATEMENT:")
    print("=" * 40)
    
    # Statement 1: A says "If D is True, then B is True"
    print("\n1️⃣ A says: 'If D is True, then B is True'")
    print(f"   A is: {'Truth-Teller' if A else 'Liar'}")
    print(f"   D is: {'True' if D else 'False'}")
    print(f"   B is: {'True' if B else 'False'}")
    print()
    print("   🧮 Evaluating the IF-THEN:")
    print("   'If D is True, then B is True'")
    print(f"   = 'If {D}, then {B}'")
    print(f"   = 'If False, then True'")
    print("   = True (because when condition is False, IF-THEN is always True)")
    print()
    print(f"   ✅ Since A is a Truth-Teller and the statement is True → CONSISTENT")
    
    # Statement 2: B says "D is a Liar OR C is a Liar"
    print("\n2️⃣ B says: 'D is a Liar OR C is a Liar'")
    print(f"   B is: {'Truth-Teller' if B else 'Liar'}")
    print(f"   D is: {'Truth-Teller' if D else 'Liar'}")
    print(f"   C is: {'Truth-Teller' if C else 'Liar'}")
    print()
    print("   🧮 Evaluating the OR:")
    print("   'D is a Liar OR C is a Liar'")
    print(f"   = '{not D} OR {not C}'")
    print(f"   = 'True OR True'")
    print("   = True")
    print()
    print(f"   ✅ Since B is a Truth-Teller and the statement is True → CONSISTENT")
    
    # Statement 3: C says "If B is False, then A is False"
    print("\n3️⃣ C says: 'If B is False, then A is False'")
    print(f"   C is: {'Truth-Teller' if C else 'Liar'}")
    print(f"   B is: {'True' if B else 'False'}")
    print(f"   A is: {'True' if A else 'False'}")
    print()
    print("   🧮 Evaluating the IF-THEN:")
    print("   'If B is False, then A is False'")
    print(f"   = 'If {not B}, then {not A}'")
    print(f"   = 'If False, then False'")
    print("   = True (because when condition is False, IF-THEN is always True)")
    print()
    print(f"   ❌ BUT C is a Liar, so the statement should be False!")
    print(f"   ❌ Liar said something True → INCONSISTENT!")
    
    # Statement 4: D says "C is a Truth-Teller OR B is a Liar"
    print("\n4️⃣ D says: 'C is a Truth-Teller OR B is a Liar'")
    print(f"   D is: {'Truth-Teller' if D else 'Liar'}")
    print(f"   C is: {'Truth-Teller' if C else 'Liar'}")
    print(f"   B is: {'Truth-Teller' if B else 'Liar'}")
    print()
    print("   🧮 Evaluating the OR:")
    print("   'C is a Truth-Teller OR B is a Liar'")
    print(f"   = '{C} OR {not B}'")
    print(f"   = 'False OR False'")
    print("   = False")
    print()
    print(f"   ✅ Since D is a Liar and the statement is False → CONSISTENT")
    
    print("\n🎯 CONCLUSION:")
    print("❌ Your solution is INCORRECT because statement 3 is inconsistent!")
    print()
    
    print("🔍 FINDING THE CORRECT SOLUTION...")
    find_correct_solution()

def find_correct_solution():
    print("=" * 50)
    print()
    
    # Create boolean variables
    A, B, C, D = Bools('A B C D')
    solver = Solver()
    
    print("🧮 Using Z3 solver to find the correct solution...")
    
    # Statement 1: A says "If D is True, then B is True"
    stmt1 = Implies(D == True, B == True)
    solver.add(Implies(A, stmt1))
    solver.add(Implies(Not(A), Not(stmt1)))
    
    # Statement 2: B says "D is a Liar OR C is a Liar" 
    stmt2 = Or(D == False, C == False)
    solver.add(Implies(B, stmt2))
    solver.add(Implies(Not(B), Not(stmt2)))
    
    # Statement 3: C says "If B is False, then A is False"
    stmt3 = Implies(B == False, A == False)
    solver.add(Implies(C, stmt3))
    solver.add(Implies(Not(C), Not(stmt3)))
    
    # Statement 4: D says "C is a Truth-Teller OR B is a Liar"
    stmt4 = Or(C == True, B == False)
    solver.add(Implies(D, stmt4))
    solver.add(Implies(Not(D), Not(stmt4)))
    
    # Try different truth-teller counts
    for count in [2, 3]:
        print(f"\n🔍 Trying with {count} truth-tellers...")
        solver.push()
        
        truth_count = Sum([If(A, 1, 0), If(B, 1, 0), If(C, 1, 0), If(D, 1, 0)])
        solver.add(truth_count == count)
        
        if solver.check() == sat:
            model = solver.model()
            print(f"✅ CORRECT SOLUTION FOUND with {count} truth-tellers:")
            print(f"   A: {'Truth-Teller' if model[A] else 'Liar'} ({model[A]})")
            print(f"   B: {'Truth-Teller' if model[B] else 'Liar'} ({model[B]})")
            print(f"   C: {'Truth-Teller' if model[C] else 'Liar'} ({model[C]})")
            print(f"   D: {'Truth-Teller' if model[D] else 'Liar'} ({model[D]})")
            
            verify_correct_solution(bool(model[A]), bool(model[B]), bool(model[C]), bool(model[D]))
            solver.pop()
            return
        else:
            print(f"❌ No solution with {count} truth-tellers")
            solver.pop()

def verify_correct_solution(A, B, C, D):
    print(f"\n🔍 VERIFYING CORRECT SOLUTION: A:{A}, B:{B}, C:{C}, D:{D}")
    print("=" * 40)
    
    # Verify each statement
    print(f"\n1️⃣ A ({'T' if A else 'L'}) says: 'If D is True, then B is True'")
    stmt1_value = (not D) or B  # If D, then B
    print(f"   Evaluates to: {stmt1_value}")
    print(f"   {'✅' if A == stmt1_value else '❌'} Consistent with A being {'Truth-Teller' if A else 'Liar'}")
    
    print(f"\n2️⃣ B ({'T' if B else 'L'}) says: 'D is a Liar OR C is a Liar'")
    stmt2_value = (not D) or (not C)
    print(f"   Evaluates to: {stmt2_value}")
    print(f"   {'✅' if B == stmt2_value else '❌'} Consistent with B being {'Truth-Teller' if B else 'Liar'}")
    
    print(f"\n3️⃣ C ({'T' if C else 'L'}) says: 'If B is False, then A is False'")
    stmt3_value = B or (not A)  # If not B, then not A
    print(f"   Evaluates to: {stmt3_value}")
    print(f"   {'✅' if C == stmt3_value else '❌'} Consistent with C being {'Truth-Teller' if C else 'Liar'}")
    
    print(f"\n4️⃣ D ({'T' if D else 'L'}) says: 'C is a Truth-Teller OR B is a Liar'")
    stmt4_value = C or (not B)
    print(f"   Evaluates to: {stmt4_value}")
    print(f"   {'✅' if D == stmt4_value else '❌'} Consistent with D being {'Truth-Teller' if D else 'Liar'}")

def explain_if_then_rules():
    print("\n" + "=" * 60)
    print("📚 HOW TO HANDLE IF-THEN STATEMENTS")
    print("=" * 60)
    
    print("\n🔑 KEY RULE: 'If P, then Q' is FALSE only when P is TRUE and Q is FALSE")
    print("\n📊 Truth Table:")
    print("   P | Q | If P, then Q")
    print("   T | T |     T")
    print("   T | F |     F  ← ONLY case where it's false!")
    print("   F | T |     T")
    print("   F | F |     T")
    
    print("\n💡 STRATEGY:")
    print("1. Identify who's speaking (Truth-Teller or Liar)")
    print("2. Determine what the IF-THEN statement claims")
    print("3. Evaluate the statement using the actual values")
    print("4. Check if the result matches the speaker's nature:")
    print("   - Truth-Teller → statement should be TRUE")
    print("   - Liar → statement should be FALSE")
    
    print("\n🎯 QUICK TIP:")
    print("When you see 'If [False thing], then [anything]' → always TRUE")
    print("This often trips people up!")

if __name__ == "__main__":
    analyze_user_puzzle()
    explain_if_then_rules() 