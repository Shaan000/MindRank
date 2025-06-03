import random
from z3 import *

def api_generate_hard(num_players):
    """Generate a hard puzzle with DIRECT, AND, OR, IF statements (at least one IF required)."""
    max_attempts = 10  # Prevent infinite loops
    
    for attempt in range(max_attempts):
        try:
            people = [chr(ord('A') + i) for i in range(num_players)]
            
            # Compute num_truth_tellers = max(2, round(0.6 * num_players))
            num_truth_tellers = max(2, round(0.6 * num_players))
            
            # Randomly assign roles to labels
            truth_teller_set = set(random.sample(people, num_truth_tellers))
            roles = {p: p in truth_teller_set for p in people}
            
            z3_vars = {p: Bool(p) for p in people}
            solver = Solver()
            
            # Calculate how many advanced statements (IF) we need
            # For hard mode: require at least 1 IF, but cap at half of players (rounded up)
            max_advanced = (num_players + 1) // 2  # This gives us ceil(num_players / 2)
            min_ifs = 1  # Hard mode requires at least one IF
            required_advanced = min(min_ifs, max_advanced) 
            
            # Create statement type assignments
            statement_types = []
            
            # Add required IF statements
            statement_types.extend(["IF"] * min_ifs)
            
            # Fill remaining advanced slots with more IF statements
            remaining_advanced = max_advanced - required_advanced
            statement_types.extend(["IF"] * remaining_advanced)
            
            # Fill remaining slots with lower-tier statements (easy + medium mode)
            remaining_slots = num_players - len(statement_types)
            lower_tier_options = ["DIRECT", "AND", "OR"]
            for _ in range(remaining_slots):
                statement_types.append(random.choice(lower_tier_options))
            
            # Shuffle to randomize assignment
            random.shuffle(statement_types)
            
            statements = {}
            
            # Assign statement types to speakers
            for i, speaker in enumerate(people):
                others = [p for p in people if p != speaker]
                mode = statement_types[i]

                if mode == "IF":
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
                    
                    implication_statement = f"If {cond} is {'True' if cond_val else 'False'}, then {result} is {'True' if result_val else 'False'}."
                    
                    statements[speaker] = {"text": implication_statement, "details": {
                        "mode": "IF",
                        "cond": cond,
                        "cond_val": cond_val,
                        "result": result,
                        "result_val": result_val
                    }}
                elif mode == "DIRECT":
                    target = random.choice(others)
                    actual = roles[target]
                    # If speaker is truth-teller, they tell truth; if liar, they lie
                    claim = actual if roles[speaker] else not actual
                    sentence = f"{target} is a {'Truth-Teller' if claim else 'Liar'}."
                    statements[speaker] = {"text": sentence, "details": {
                        "mode": "DIRECT",
                        "target": target,
                        "claim": claim
                    }}
                elif mode == "AND":
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    
                    if roles[speaker]:  # Truth-teller makes true AND statement
                        c1, c2 = actual1, actual2
                    else:  # Liar makes false AND statement (at least one part false)
                        if random.choice([True, False]):
                            c1, c2 = not actual1, actual2  # Make first part false
                        else:
                            c1, c2 = actual1, not actual2  # Make second part false
                    
                    sentence = (
                        f"{t1} is a {'Truth-Teller' if c1 else 'Liar'}"
                        f" AND {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    )
                    statements[speaker] = {"text": sentence, "details": {
                        "mode": "AND",
                        "t1": t1,
                        "t2": t2,
                        "c1": c1,
                        "c2": c2
                    }}
                else:  # OR
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    
                    if roles[speaker]:  # Truth-teller makes true OR statement
                        c1, c2 = actual1, actual2
                    else:  # Liar makes false OR statement (both parts false)
                        c1, c2 = not actual1, not actual2
                    
                    sentence = (
                        f"{t1} is a {'Truth-Teller' if c1 else 'Liar'}"
                        f" OR {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    )
                    statements[speaker] = {"text": sentence, "details": {
                        "mode": "OR",
                        "t1": t1,
                        "t2": t2,
                        "c1": c1,
                        "c2": c2
                    }}

            # Apply the constraints for validation
            for speaker, content in statements.items():
                d = content["details"]
                
                if d["mode"] == "IF":
                    implication = Implies(z3_vars[d["cond"]] == d["cond_val"], z3_vars[d["result"]] == d["result_val"])
                    solver.add(Implies(z3_vars[speaker], implication))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
                    
                elif d["mode"] == "DIRECT":
                    solver.add(Implies(z3_vars[speaker], z3_vars[d["target"]] == d["claim"]))
                    solver.add(Implies(Not(z3_vars[speaker]), z3_vars[d["target"]] != d["claim"]))
                    
                elif d["mode"] == "AND":
                    solver.add(Implies(z3_vars[speaker], And(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                    solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))
                    
                else:  # OR
                    solver.add(Implies(z3_vars[speaker], Or(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                    solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))

            solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

            # Check if puzzle is solvable
            if solver.check() != sat:
                print(f"⚠️ Hard puzzle attempt {attempt + 1} failed - no solution found, retrying...")
                continue  # Try again instead of failing
            
            # Get a model to verify consistency
            model = solver.model()
            solution = {p: bool(model[z3_vars[p]]) for p in people}
            
            # Convert complex statements to simple format for UI compatibility
            simple_statement_data = convert_to_simple_format(statements)

            print(f"✅ Hard puzzle generated successfully on attempt {attempt + 1}")
            return {
                "puzzle_id": f"hard_{num_players}_{random.randint(1000, 9999)}",
                "num_players": num_players,
                "num_truth_tellers": num_truth_tellers,
                "statements": {p: statements[p]["text"] for p in people},
                "statement_data": simple_statement_data,  # UI-compatible format
                "full_statement_data": {p: statements[p]["details"] for p in people},  # Keep original for validation
                "solution": solution
            }
            
        except Exception as e:
            print(f"⚠️ Hard puzzle attempt {attempt + 1} failed with error: {str(e)}, retrying...")
            continue
    
    # If we get here, all attempts failed
    print(f"❌ Failed to generate hard puzzle after {max_attempts} attempts")
    raise RuntimeError(f"Failed to generate a valid hard puzzle after {max_attempts} attempts")

def check_hard_solution(data):
    # Handle both 'player_assignments' (from React) and 'guess' (legacy) formats
    player_assignments = data.get("player_assignments") or data.get("guess", {})
    
    # Use full_statement_data if available, otherwise fall back to statement_data
    statements = data.get("full_statement_data", data.get("statement_data", {}))
    num_truth_tellers = data.get("num_truth_tellers")
    
    if not statements:
        return {"valid": False, "error": "Missing statement data"}
    if not player_assignments:
        return {"valid": False, "error": "Missing player assignments"}
    if num_truth_tellers is None:
        return {"valid": False, "error": "Missing num_truth_tellers"}
    
    people = list(statements.keys())
    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()

    # FIXED: Same constraint logic as generation
    for speaker, d in statements.items():
        if isinstance(d, dict) and "mode" in d:
            # Full statement data format
            if d["mode"] == "IF":
                implication = Implies(z3_vars[d["cond"]] == d["cond_val"], z3_vars[d["result"]] == d["result_val"])
                solver.add(Implies(z3_vars[speaker], implication))
                solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
                
            elif d["mode"] == "DIRECT":
                solver.add(Implies(z3_vars[speaker], z3_vars[d["target"]] == d["claim"]))
                solver.add(Implies(Not(z3_vars[speaker]), z3_vars[d["target"]] != d["claim"]))
                
            elif d["mode"] == "AND":
                solver.add(Implies(z3_vars[speaker], And(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))
                
            else:  # OR
                solver.add(Implies(z3_vars[speaker], Or(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))
        else:
            # Simple statement data format (fallback)
            target = d.get("target")
            truth_value = d.get("truth_value")
            if target and truth_value is not None:
                solver.add(Implies(z3_vars[speaker], z3_vars[target] == truth_value))
                solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != truth_value))

    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

    for person, is_truth in player_assignments.items():
        solver.add(z3_vars[person] == is_truth)

    result = solver.check()
    return {"valid": result == sat}

def convert_to_simple_format(statements):
    """Convert complex statements to simple UI-compatible format"""
    simple_statements = {}
    for speaker, entry in statements.items():
        d = entry["details"]
        if d["mode"] == "DIRECT":
            simple_statements[speaker] = {
                "target": d["target"],
                "truth_value": d["claim"]
            }
        elif d["mode"] in ["AND", "OR"]:
            # Use first target from AND/OR statement
            target = d["t1"]
            truth_value = d["c1"]
            simple_statements[speaker] = {
                "target": target,
                "truth_value": truth_value
            }
        elif d["mode"] == "IF":
            # Use result target from IF statement
            target = d["result"]
            truth_value = d["result_val"]
            simple_statements[speaker] = {
                "target": target,
                "truth_value": truth_value
            }
    return simple_statements
