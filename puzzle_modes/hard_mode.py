import random
from z3 import Solver, Bool, And, Or, Implies, Not, Sum, If, sat

def api_generate_hard(num_players: int) -> dict:
    """Generate a hard puzzle with DIRECT, AND, OR, IF statements (at least one IF required)."""
    max_attempts = 10  # Prevent infinite loops
    
    for attempt in range(max_attempts):
        try:
            # 1) Build generic labels: ["A", "B", …]
            people = [chr(ord('A') + i) for i in range(num_players)]
            
            # 2) Compute num_truth_tellers = max(2, round(0.6 * num_players))
            num_truth_tellers = max(2, round(0.6 * num_players))
            
            # 3) Randomly assign roles to labels
            truth_teller_set = set(random.sample(people, num_truth_tellers))
            roles = {p: p in truth_teller_set for p in people}
            
            # Initialize data structures
            statements = {}
            statement_logic = {}
            
            # 4) Ensure exactly one IF/THEN appears among the speakers
            has_if = False
            
            for i, speaker in enumerate(people):
                others = [p for p in people if p != speaker]
                
                # Force IF mode for last speaker if no IF yet
                if not has_if and i == len(people) - 1:
                    mode = "IF"
                else:
                    mode = random.choice(["DIRECT", "AND", "OR", "IF"])
                
                if mode == "IF":
                    has_if = True
                    # Pick condition and result from others
                    cond, result = random.sample(others, 2)
                    
                    # Get actual truth values for condition and result persons
                    cond_actual = roles[cond]
                    result_actual = roles[result]
                    
                    # Generate IF statement that's consistent with speaker's role
                    if roles[speaker]:  # Truth-teller: implication must be TRUE
                        # Choose values to make "If cond_val, then result_val" TRUE
                        options = []
                        
                        # Option 1: Make condition False (always makes implication true)
                        options.append((not cond_actual, random.choice([True, False])))
                        
                        # Option 2: Make condition True and result True (makes implication true)
                        options.append((cond_actual, result_actual))
                        
                        # Option 3: If cond is actually False, we can make result anything
                        if not cond_actual:
                            options.append((cond_actual, not result_actual))
                        
                        cond_val, result_val = random.choice(options)
                    else:  # Liar: implication must be FALSE
                        # ONLY way to make implication false: condition True, result False
                        # So we need cond_val = cond_actual AND result_val != result_actual
                        # But this only works if cond_actual is True
                        if cond_actual:
                            cond_val = True  # Must be True
                            result_val = not result_actual  # Must be opposite of actual
                        else:
                            # If cond_actual is False, we can't make a false implication
                            # So swap the roles or try different people
                            if result_actual:  # Use result as condition instead
                                cond, result = result, cond  # Swap
                                cond_val = True  # result_actual was True
                                result_val = not roles[result]  # not cond_actual
                            else:
                                # Both are False, can't make false implication easily
                                # Fall back to making a true statement for now
                                cond_val = False
                                result_val = random.choice([True, False])
                    
                    statement_text = f"If {cond} is {'True' if cond_val else 'False'}, then {result} is {'True' if result_val else 'False'}."
                    statement_logic[speaker] = {
                        "mode": "IF",
                        "cond": cond,
                        "cond_val": cond_val,
                        "result": result,
                        "result_val": result_val
                    }
                    
                elif mode == "DIRECT":
                    # Same as easy/medium mode
                    target = random.choice(others)
                    actual = roles[target]
                    claim = actual if roles[speaker] else not actual
                    
                    statement_text = f"{target} is a {'Truth-Teller' if claim else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "DIRECT",
                        "target": target,
                        "claim": claim
                    }
                    
                elif mode == "AND":
                    # Same as medium mode
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    c1 = actual1 if roles[speaker] else not actual1
                    c2 = actual2 if roles[speaker] else not actual2
                    
                    statement_text = f"{t1} is a {'Truth-Teller' if c1 else 'Liar'} AND {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "AND",
                        "t1": t1,
                        "c1": c1,
                        "t2": t2,
                        "c2": c2
                    }
                    
                else:  # OR
                    # Same as medium mode
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    c1 = actual1 if roles[speaker] else not actual1
                    c2 = actual2 if roles[speaker] else not actual2
                    
                    statement_text = f"{t1} is a {'Truth-Teller' if c1 else 'Liar'} OR {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "OR",
                        "t1": t1,
                        "c1": c1,
                        "t2": t2,
                        "c2": c2
                    }
                
                statements[speaker] = statement_text
            
            # 5) Create Z3 Solver and add constraints
            z3_vars = {p: Bool(p) for p in people}
            solver = Solver()
            
            for speaker in people:
                logic = statement_logic[speaker]
                
                if logic["mode"] == "DIRECT":
                    target = logic["target"]
                    claim = logic["claim"]
                    solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
                    solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] == (not claim)))
                    
                elif logic["mode"] == "AND":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    solver.add(Implies(z3_vars[speaker], And(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(And(z3_vars[t1] == c1, z3_vars[t2] == c2))))
                    
                elif logic["mode"] == "OR":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    solver.add(Implies(z3_vars[speaker], Or(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(Or(z3_vars[t1] == c1, z3_vars[t2] == c2))))
                    
                elif logic["mode"] == "IF":
                    cond = logic["cond"]
                    cond_val = logic["cond_val"]
                    result = logic["result"]
                    result_val = logic["result_val"]
                    
                    # Truth-teller: "If cond is cond_val, then result is result_val"
                    implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
                    solver.add(Implies(z3_vars[speaker], implication))
                    # Liar: negation of the implication
                    solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
            
            # 6) Add constraint for total number of truth-tellers
            solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
            
            # 7) Solve and extract model
            if solver.check() != sat:
                print(f"⚠️ Hard puzzle attempt {attempt + 1} failed - no solution found, retrying...")
                continue  # Try again instead of recursively calling
            
            model = solver.model()
            solution = {p: bool(model[z3_vars[p]]) for p in people}
            
            # 8) Return the required dictionary
            print(f"✅ Hard puzzle generated successfully on attempt {attempt + 1}")
            return {
                "num_players": num_players,
                "num_truth_tellers": num_truth_tellers,
                "statements": statements,
                "statement_logic": statement_logic,
                "solution": solution
            }
            
        except Exception as e:
            print(f"⚠️ Hard puzzle attempt {attempt + 1} failed with error: {str(e)}, retrying...")
            continue
    
    # If we get here, all attempts failed
    print(f"❌ Failed to generate hard puzzle after {max_attempts} attempts")
    raise RuntimeError(f"Failed to generate a valid hard puzzle after {max_attempts} attempts")


def check_hard_solution(data: dict) -> dict:
    """Check if a proposed solution is valid for a hard puzzle."""
    # 1) Read data
    statement_logic = data["statement_logic"]
    num_truth_tellers = data["num_truth_tellers"]
    guess = data["guess"]
    
    # 2) Create z3_vars for each person
    people = list(statement_logic.keys())
    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()
    
    # 3) Re-apply the exact same constraints
    for speaker, logic in statement_logic.items():
        if logic["mode"] == "DIRECT":
            target = logic["target"]
            claim = logic["claim"]
            solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
            solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] == (not claim)))
            
        elif logic["mode"] == "AND":
            t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
            solver.add(Implies(z3_vars[speaker], And(z3_vars[t1] == c1, z3_vars[t2] == c2)))
            solver.add(Implies(Not(z3_vars[speaker]), Not(And(z3_vars[t1] == c1, z3_vars[t2] == c2))))
            
        elif logic["mode"] == "OR":
            t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
            solver.add(Implies(z3_vars[speaker], Or(z3_vars[t1] == c1, z3_vars[t2] == c2)))
            solver.add(Implies(Not(z3_vars[speaker]), Not(Or(z3_vars[t1] == c1, z3_vars[t2] == c2))))
            
        elif logic["mode"] == "IF":
            cond = logic["cond"]
            cond_val = logic["cond_val"]
            result = logic["result"]
            result_val = logic["result_val"]
            
            # Re-apply the exact same IF logic
            implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
            solver.add(Implies(z3_vars[speaker], implication))
            solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
    
    # 4) Add sum constraint
    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
    
    # 5) Constrain variables according to guess
    for person, value in guess.items():
        solver.add(z3_vars[person] == value)
    
    # 6) Check satisfiability
    return {"valid": solver.check() == sat} 