import random
from z3 import *

# API for generating medium puzzles
# Returns JSON-serializable data without raw Z3 objects

def api_generate_medium(num_players):
    """Generate a medium puzzle with DIRECT, AND, OR statements."""
    max_attempts = 10  # Prevent infinite loops
    
    for attempt in range(max_attempts):
        try:
            people = [chr(ord('A') + i) for i in range(num_players)]
            num_truth_tellers = max(2, round(0.6 * num_players))
            truth_teller_set = set(random.sample(people, num_truth_tellers))
            roles = {p: p in truth_teller_set for p in people}

            z3_vars = {p: Bool(p) for p in people}
            solver = Solver()

            def generate_statements():
                statements = {}
                
                # Calculate how many advanced statements (AND/OR) we need
                # For medium mode: require at least 1 AND and 1 OR, but cap at half of players (rounded up)
                max_advanced = (num_players + 1) // 2  # This gives us ceil(num_players / 2)
                min_ands = 1
                min_ors = 1
                required_advanced = min_ands + min_ors
                
                # Don't exceed max_advanced with required features
                if required_advanced > max_advanced:
                    # If we can't fit both, prioritize AND statements
                    min_ands = max_advanced // 2
                    min_ors = max_advanced - min_ands
                    required_advanced = min_ands + min_ors
                
                # Create statement type assignments
                statement_types = []
                
                # Add required AND statements
                statement_types.extend(["AND"] * min_ands)
                
                # Add required OR statements
                statement_types.extend(["OR"] * min_ors)
                
                # Fill remaining advanced slots randomly between AND/OR
                remaining_advanced = max_advanced - required_advanced
                for _ in range(remaining_advanced):
                    statement_types.append(random.choice(["AND", "OR"]))
                
                # Fill remaining slots with DIRECT (easy mode) statements
                remaining_slots = num_players - len(statement_types)
                statement_types.extend(["DIRECT"] * remaining_slots)
                
                # Shuffle to randomize assignment
                random.shuffle(statement_types)
                
                # Assign statement types to speakers
                for i, speaker in enumerate(people):
                    others = [p for p in people if p != speaker]
                    choice = statement_types[i]
                    
                    if choice == "DIRECT":
                        target = random.choice(others)
                        actual = roles[target]
                        # If speaker is truth-teller, they tell truth; if liar, they lie
                        claim = actual if roles[speaker] else not actual
                        sentence = f"{target} is a {'Truth-Teller' if claim else 'Liar'}."
                        details = {
                            "mode": "DIRECT",
                            "target": target,
                            "claim": claim
                        }
                    elif choice == "AND":
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
                        details = {
                            "mode": "AND",
                            "t1": t1,
                            "t2": t2,
                            "c1": c1,
                            "c2": c2
                        }
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
                        details = {
                            "mode": "OR",
                            "t1": t1,
                            "t2": t2,
                            "c1": c1,
                            "c2": c2
                        }
                    statements[speaker] = {"text": sentence, "details": details}
                return statements

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
                    else:
                        # For complex statements, use first target as fallback for UI
                        target = d["t1"]
                        truth_value = d["c1"]
                        simple_statements[speaker] = {
                            "target": target,
                            "truth_value": truth_value
                        }
                return simple_statements

            statements = generate_statements()
            
            # Apply Z3 constraint logic
            for speaker, entry in statements.items():
                d = entry["details"]
                
                if d["mode"] == "DIRECT":
                    # If speaker is truth-teller, their claim about target must be accurate
                    solver.add(Implies(z3_vars[speaker], z3_vars[d["target"]] == d["claim"]))
                    # If speaker is liar, their claim about target must be false
                    solver.add(Implies(Not(z3_vars[speaker]), z3_vars[d["target"]] != d["claim"]))
                    
                elif d["mode"] == "AND":
                    # If speaker is truth-teller, both parts of AND must be true
                    solver.add(Implies(z3_vars[speaker], And(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                    # If speaker is liar, at least one part of AND must be false
                    solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))
                    
                else:  # OR
                    # If speaker is truth-teller, at least one part of OR must be true
                    solver.add(Implies(z3_vars[speaker], Or(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                    # If speaker is liar, both parts of OR must be false
                    solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))

            solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

            if solver.check() != sat:
                print(f"⚠️ Medium puzzle attempt {attempt + 1} failed - no solution found, retrying...")
                continue  # Try again instead of returning error
            
            model = solver.model()
            solution = {p: bool(model[z3_vars[p]]) for p in people}
            
            # Convert complex statements to simple format for UI compatibility
            simple_statement_data = convert_to_simple_format(statements)
            
            print(f"✅ Medium puzzle generated successfully on attempt {attempt + 1}")
            return {
                "puzzle_id": f"medium_{num_players}_{random.randint(1000, 9999)}",
                "num_players": num_players,
                "num_truth_tellers": num_truth_tellers,
                "statements": {p: statements[p]["text"] for p in people},
                "statement_data": simple_statement_data,  # UI-compatible format
                "full_statement_data": {p: statements[p]["details"] for p in people},  # Keep original for validation
                "solution": solution
            }
            
        except Exception as e:
            print(f"⚠️ Medium puzzle attempt {attempt + 1} failed with error: {str(e)}, retrying...")
            continue
    
    # If we get here, all attempts failed
    print(f"❌ Failed to generate medium puzzle after {max_attempts} attempts")
    raise RuntimeError(f"Failed to generate a valid medium puzzle after {max_attempts} attempts")

def check_medium_solution(data):
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
            if d["mode"] == "DIRECT":
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
