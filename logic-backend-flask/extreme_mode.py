import random
from z3 import Solver, Bool, And, Or, Xor, Implies, Not, Sum, If, sat

def api_generate_extreme(num_players: int) -> dict:
    """Generate an extreme puzzle with all advanced operators."""
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
            
            # Track which advanced operators we've used (ensure at least one of each)
            # Calculate max advanced features: at most half (rounded up if odd)
            max_advanced = (num_players + 1) // 2  # This gives us ceil(num_players / 2)
            
            # Scale required complexity with player count, but respect max_advanced limit
            if num_players >= 7:
                # Large puzzles: Include all advanced features if space allows
                desired_modes = ["XOR", "SELF_REF", "GROUP", "NESTED_IF"]
            elif num_players >= 5:
                # Medium puzzles: Include core advanced features
                desired_modes = ["XOR", "SELF_REF", "GROUP"]
            else:
                # Small puzzles: Include essential advanced features
                desired_modes = ["XOR", "SELF_REF"]
            
            # Limit desired modes to max_advanced
            required_modes = desired_modes[:max_advanced]
            used_modes = set()
            
            # Create statement type assignments
            statement_types = []
            
            # Add required advanced features
            for mode in required_modes:
                statement_types.append(mode)
                used_modes.add(mode)
            
            # Fill remaining advanced slots with random advanced features
            remaining_advanced = max_advanced - len(required_modes)
            available_advanced = ["XOR", "SELF_REF", "GROUP", "NESTED_IF", "IF"]
            for _ in range(remaining_advanced):
                statement_types.append(random.choice(available_advanced))
            
            # Fill remaining slots with lower-tier statements (easy + medium + hard mode)
            remaining_slots = num_players - len(statement_types)
            lower_tier_options = ["DIRECT", "AND", "OR", "IF"]
            for _ in range(remaining_slots):
                statement_types.append(random.choice(lower_tier_options))
            
            # Shuffle to randomize assignment
            random.shuffle(statement_types)
            
            # 4) For each speaker, assign the predetermined mode
            for i, speaker in enumerate(people):
                others = [p for p in people if p != speaker]
                mode = statement_types[i]
                
                if mode in required_modes:
                    used_modes.add(mode)
                
                if mode == "DIRECT":
                    target = random.choice(others)
                    actual = roles[target]
                    # If speaker is truth-teller, they tell truth; if liar, they lie
                    claim = actual if roles[speaker] else not actual
                    
                    statement_text = f"{target} is a {'Truth-Teller' if claim else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "DIRECT",
                        "target": target,
                        "claim": claim
                    }
                    
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
                    
                    statement_text = f"{t1} is a {'Truth-Teller' if c1 else 'Liar'} AND {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "AND",
                        "t1": t1,
                        "c1": c1,
                        "t2": t2,
                        "c2": c2
                    }
                    
                elif mode == "OR":
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    
                    if roles[speaker]:  # Truth-teller makes true OR statement
                        c1, c2 = actual1, actual2
                    else:  # Liar makes false OR statement (both parts false)
                        c1, c2 = not actual1, not actual2
                    
                    statement_text = f"{t1} is a {'Truth-Teller' if c1 else 'Liar'} OR {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "OR",
                        "t1": t1,
                        "c1": c1,
                        "t2": t2,
                        "c2": c2
                    }
                    
                elif mode == "IF":
                    cond, result = random.sample(others, 2)
                    cond_val = random.choice([True, False])
                    result_val = random.choice([True, False])
                    
                    statement_text = f"If {cond} is {'True' if cond_val else 'False'}, then {result} is {'True' if result_val else 'False'}."
                    statement_logic[speaker] = {
                        "mode": "IF",
                        "cond": cond,
                        "cond_val": cond_val,
                        "result": result,
                        "result_val": result_val
                    }
                    
                elif mode == "XOR":
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    
                    if roles[speaker]:  # Truth-teller makes true XOR statement
                        # XOR is true when exactly one is true
                        if actual1 != actual2:  # One is truth-teller, one is liar
                            c1, c2 = actual1, actual2  # Make XOR true
                        else:  # Both same type
                            # Make them appear different to make XOR true
                            c1, c2 = actual1, not actual2
                    else:  # Liar makes false XOR statement
                        # XOR is false when both parts have same truth value
                        c1, c2 = actual1, actual1  # Both same to make XOR false
                    
                    statement_text = f"Either {t1} is a {'Truth-Teller' if c1 else 'Liar'} OR {t2} is a {'Truth-Teller' if c2 else 'Liar'}, but not both."
                    statement_logic[speaker] = {
                        "mode": "XOR",
                        "t1": t1,
                        "c1": c1,
                        "t2": t2,
                        "c2": c2
                    }
                    
                elif mode == "IFF":
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    
                    if roles[speaker]:  # Truth-teller makes true IFF statement
                        # IFF is true when both parts have same truth value
                        c1, c2 = actual1, actual2  # Both same to make IFF true
                    else:  # Liar makes false IFF statement
                        # IFF is false when parts have different truth values
                        c1, c2 = actual1, not actual2  # Make them different to make IFF false
                    
                    statement_text = f"{t1} is a {'Truth-Teller' if c1 else 'Liar'} if and only if {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "IFF",
                        "t1": t1,
                        "c1": c1,
                        "t2": t2,
                        "c2": c2
                    }
                    
                elif mode == "NESTED_IF":
                    if len(others) >= 3:
                        outer_cond, inner_cond, inner_result = random.sample(others, 3)
                    else:
                        # Not enough others, fall back to simpler mode
                        outer_cond, inner_result = random.sample(others, 2)
                        inner_cond = random.choice([p for p in others if p not in [outer_cond, inner_result]])
                        
                    outer_val = random.choice([True, False])
                    inner_val = random.choice([True, False])
                    inner_result_val = random.choice([True, False])
                    
                    statement_text = f"If {outer_cond} is {'True' if outer_val else 'False'}, then if {inner_cond} is {'True' if inner_val else 'False'}, then {inner_result} is {'True' if inner_result_val else 'False'}."
                    statement_logic[speaker] = {
                        "mode": "NESTED_IF",
                        "outer_cond": outer_cond,
                        "outer_val": outer_val,
                        "inner_cond": inner_cond,
                        "inner_val": inner_val,
                        "inner_result": inner_result,
                        "inner_result_val": inner_result_val
                    }
                    
                elif mode == "SELF_REF":
                    c = random.choice([True, False])
                    
                    statement_text = f"{speaker} is a {'Truth-Teller' if c else 'Liar'}."
                    statement_logic[speaker] = {
                        "mode": "DIRECT",  # Self-reference is handled as DIRECT with target=speaker
                        "target": speaker,
                        "claim": c
                    }
                    
                elif mode == "GROUP":
                    # Pick a subset of others for group logic
                    group_size = min(len(others), random.randint(2, max(2, len(others))))
                    members = random.sample(others, group_size)
                    exactly = random.randint(1, len(members) - 1)
                    
                    # Format member list in proper English
                    if len(members) == 2:
                        member_text = f"{members[0]} and {members[1]}"
                    elif len(members) == 3:
                        member_text = f"{members[0]}, {members[1]}, and {members[2]}"
                    else:
                        member_text = ", ".join(members[:-1]) + f", and {members[-1]}"
                    
                    statement_text = f"Exactly {exactly} of {member_text} are Truth-Tellers."
                    statement_logic[speaker] = {
                        "mode": "GROUP",
                        "members": members,
                        "exactly": exactly
                    }
                
                statements[speaker] = statement_text
            
            # 5) Create Z3 Solver and add constraints with FIXED logic
            z3_vars = {p: Bool(p) for p in people}
            solver = Solver()
            
            for speaker in people:
                logic = statement_logic[speaker]
                
                if logic["mode"] == "DIRECT":
                    target = logic["target"]
                    claim = logic["claim"]
                    # FIXED: Correct constraint logic
                    solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
                    solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != claim))
                    
                elif logic["mode"] == "AND":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    # FIXED: Correct AND constraint logic
                    solver.add(Implies(z3_vars[speaker], And(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                    solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[t1] != c1, z3_vars[t2] != c2)))
                    
                elif logic["mode"] == "OR":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    # FIXED: Correct OR constraint logic
                    solver.add(Implies(z3_vars[speaker], Or(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                    solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[t1] != c1, z3_vars[t2] != c2)))
                    
                elif logic["mode"] == "IF":
                    cond = logic["cond"]
                    cond_val = logic["cond_val"]
                    result = logic["result"]
                    result_val = logic["result_val"]
                    implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
                    solver.add(Implies(z3_vars[speaker], implication))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
                    
                elif logic["mode"] == "XOR":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    xor_constraint = Xor(z3_vars[t1] == c1, z3_vars[t2] == c2)
                    solver.add(Implies(z3_vars[speaker], xor_constraint))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(xor_constraint)))
                    
                elif logic["mode"] == "IFF":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    iff_constraint = (z3_vars[t1] == c1) == (z3_vars[t2] == c2)
                    solver.add(Implies(z3_vars[speaker], iff_constraint))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(iff_constraint)))
                    
                elif logic["mode"] == "NESTED_IF":
                    outer = logic["outer_cond"]
                    outer_val = logic["outer_val"]
                    inner = logic["inner_cond"]
                    inner_val = logic["inner_val"]
                    inner_result = logic["inner_result"]
                    inner_result_val = logic["inner_result_val"]
                    
                    nested_implication = Implies(
                        z3_vars[outer] == outer_val,
                        Implies(z3_vars[inner] == inner_val, z3_vars[inner_result] == inner_result_val)
                    )
                    solver.add(Implies(z3_vars[speaker], nested_implication))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(nested_implication)))
                    
                elif logic["mode"] == "GROUP":
                    members = logic["members"]
                    exactly = logic["exactly"]
                    sum_constraint = Sum([If(z3_vars[m], 1, 0) for m in members]) == exactly
                    solver.add(Implies(z3_vars[speaker], sum_constraint))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(sum_constraint)))
            
            # Add truth-teller count constraint
            solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
            
            # 6) Verify the puzzle has a solution
            if solver.check() != sat:
                print(f"⚠️ Extreme puzzle attempt {attempt + 1} failed - no solution found, retrying...")
                continue  # Try again instead of failing
            
            # Get a model to verify consistency
            model = solver.model()
            solution = {p: bool(model[z3_vars[p]]) for p in people}
            
            # Convert complex statements to simple format for UI compatibility
            simple_statement_data = {}
            for speaker, logic in statement_logic.items():
                if logic["mode"] == "DIRECT":
                    simple_statement_data[speaker] = {
                        "target": logic["target"],
                        "truth_value": logic["claim"]
                    }
                else:
                    # For complex statements, use first available target as fallback
                    if "t1" in logic:
                        target = logic["t1"]
                        truth_value = logic["c1"]
                    elif "result" in logic:
                        target = logic["result"]
                        truth_value = logic["result_val"]
                    else:
                        # Fallback to first person if no clear target
                        target = people[0] if people else "A"
                        truth_value = True
                    
                    simple_statement_data[speaker] = {
                        "target": target,
                        "truth_value": truth_value
                    }
            
            # 7) Success! Package and return the result
            print(f"✅ Extreme puzzle generated successfully on attempt {attempt + 1}")
            return {
                "puzzle_id": f"extreme_{num_players}_{random.randint(1000, 9999)}",
                "num_players": num_players,
                "num_truth_tellers": num_truth_tellers,
                "statements": statements,
                "statement_data": simple_statement_data,  # UI-compatible format
                "full_statement_data": statement_logic,  # Keep original for validation
                "solution": solution
            }
            
        except Exception as e:
            print(f"⚠️ Extreme puzzle attempt {attempt + 1} failed with error: {str(e)}, retrying...")
            continue
    
    # If we get here, all attempts failed
    print(f"❌ Failed to generate extreme puzzle after {max_attempts} attempts")
    raise RuntimeError(f"Failed to generate a valid extreme puzzle after {max_attempts} attempts")

# For backward compatibility with the exact function name used in the old system
def generate_extreme_puzzle(num_players: int) -> dict:
    return api_generate_extreme(num_players)

def check_extreme_solution(data: dict) -> dict:
    """Check if a proposed solution is valid for an extreme puzzle."""
    try:
        # Handle both 'player_assignments' (from React) and 'guess' (legacy) formats
        player_assignments = data.get("player_assignments") or data.get("guess", {})
        
        # Use full_statement_data if available, otherwise fall back to statement_data
        statement_data = data.get("full_statement_data", data.get("statement_data", {}))
        num_truth_tellers = data.get("num_truth_tellers")
        
        if not statement_data:
            return {"valid": False, "error": "Missing statement data"}
        if not player_assignments:
            return {"valid": False, "error": "Missing player assignments"}
        if num_truth_tellers is None:
            return {"valid": False, "error": "Missing num_truth_tellers"}
        
        people = list(player_assignments.keys())
        z3_vars = {p: Bool(p) for p in people}
        solver = Solver()
        
        # FIXED: Same constraint logic as generation
        for speaker, logic in statement_data.items():
            if isinstance(logic, dict) and "mode" in logic:
                mode = logic.get("mode")
                
                if mode == "DIRECT":
                    target = logic["target"]
                    claim = logic["claim"]
                    solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
                    solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != claim))
                    
                elif mode == "AND":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    solver.add(Implies(z3_vars[speaker], And(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                    solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[t1] != c1, z3_vars[t2] != c2)))
                    
                elif mode == "OR":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    solver.add(Implies(z3_vars[speaker], Or(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                    solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[t1] != c1, z3_vars[t2] != c2)))
                    
                elif mode == "IF":
                    cond = logic["cond"]
                    cond_val = logic["cond_val"]
                    result = logic["result"]
                    result_val = logic["result_val"]
                    
                    implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
                    solver.add(Implies(z3_vars[speaker], implication))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
                    
                elif mode == "XOR":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    a1 = (z3_vars[t1] == c1)
                    a2 = (z3_vars[t2] == c2)
                    
                    solver.add(Implies(z3_vars[speaker], Xor(a1, a2)))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(Xor(a1, a2))))
                    
                elif mode == "IFF":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    a1 = (z3_vars[t1] == c1)
                    a2 = (z3_vars[t2] == c2)
                    
                    # Use Implies both ways for biconditional
                    biconditional = And(Implies(a1, a2), Implies(a2, a1))
                    solver.add(Implies(z3_vars[speaker], biconditional))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(biconditional)))
                    
                elif mode == "NESTED_IF":
                    outer_cond = logic["outer_cond"]
                    outer_val = logic["outer_val"]
                    inner_cond = logic["inner_cond"]
                    inner_val = logic["inner_val"]
                    inner_result = logic["inner_result"]
                    inner_result_val = logic["inner_result_val"]
                    
                    # Build nested implication
                    inner_impl = Implies(z3_vars[inner_cond] == inner_val, z3_vars[inner_result] == inner_result_val)
                    nested_impl = Implies(z3_vars[outer_cond] == outer_val, inner_impl)
                    
                    solver.add(Implies(z3_vars[speaker], nested_impl))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(nested_impl)))
                    
                elif mode == "GROUP":
                    members = logic["members"]
                    exactly = logic["exactly"]
                    
                    # Count how many members are truth-tellers
                    cnt = Sum([If(z3_vars[m], 1, 0) for m in members])
                    
                    solver.add(Implies(z3_vars[speaker], cnt == exactly))
                    solver.add(Implies(Not(z3_vars[speaker]), cnt != exactly))
            else:
                # Simple statement data format (fallback)
                target = logic.get("target")
                truth_value = logic.get("truth_value")
                if target and truth_value is not None:
                    solver.add(Implies(z3_vars[speaker], z3_vars[target] == truth_value))
                    solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != truth_value))
        
        # Add constraint for total number of truth-tellers
        solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
        
        # Add guess constraints
        for person, value in player_assignments.items():
            solver.add(z3_vars[person] == value)
        
        # Check if solution is valid
        result = solver.check()
        return {"valid": result == sat}
        
    except Exception as e:
        return {"valid": False, "error": str(e)} 