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
            required_modes = ["AND", "OR", "IF", "XOR", "IFF", "NESTED_IF", "SELF_REF", "GROUP"]
            used_modes = set()
            
            # 4) For each speaker, choose mode ensuring we hit all required types
            for i, speaker in enumerate(people):
                others = [p for p in people if p != speaker]
                
                # For the last few speakers, force unused required modes
                remaining_speakers = len(people) - i
                unused_required = [mode for mode in required_modes if mode not in used_modes]
                
                if unused_required and remaining_speakers <= len(unused_required):
                    mode = unused_required[0]
                else:
                    # Choose from all modes
                    all_modes = ["DIRECT", "AND", "OR", "IF", "XOR", "IFF", "NESTED_IF", "SELF_REF", "GROUP"]
                    mode = random.choice(all_modes)
                
                if mode in required_modes:
                    used_modes.add(mode)
                
                if mode == "DIRECT":
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
                    
                elif mode == "OR":
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
                    
                    implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
                    solver.add(Implies(z3_vars[speaker], implication))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
                    
                elif logic["mode"] == "XOR":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    a1 = (z3_vars[t1] == c1)
                    a2 = (z3_vars[t2] == c2)
                    
                    solver.add(Implies(z3_vars[speaker], Xor(a1, a2)))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(Xor(a1, a2))))
                    
                elif logic["mode"] == "IFF":
                    t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
                    a1 = (z3_vars[t1] == c1)
                    a2 = (z3_vars[t2] == c2)
                    
                    # Use Implies both ways for biconditional
                    biconditional = And(Implies(a1, a2), Implies(a2, a1))
                    solver.add(Implies(z3_vars[speaker], biconditional))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(biconditional)))
                    
                elif logic["mode"] == "NESTED_IF":
                    outer_cond = logic["outer_cond"]
                    outer_val = logic["outer_val"]
                    inner_cond = logic["inner_cond"]
                    inner_val = logic["inner_val"]
                    inner_result = logic["inner_result"]
                    inner_result_val = logic["inner_result_val"]
                    
                    # Build nested implication: If outer_cond==outer_val, then (If inner_cond==inner_val, then inner_result==inner_result_val)
                    inner_impl = Implies(z3_vars[inner_cond] == inner_val, z3_vars[inner_result] == inner_result_val)
                    nested_impl = Implies(z3_vars[outer_cond] == outer_val, inner_impl)
                    
                    solver.add(Implies(z3_vars[speaker], nested_impl))
                    solver.add(Implies(Not(z3_vars[speaker]), Not(nested_impl)))
                    
                elif logic["mode"] == "GROUP":
                    members = logic["members"]
                    exactly = logic["exactly"]
                    
                    # Count how many members are truth-tellers
                    cnt = Sum([If(z3_vars[m], 1, 0) for m in members])
                    
                    solver.add(Implies(z3_vars[speaker], cnt == exactly))
                    solver.add(Implies(Not(z3_vars[speaker]), cnt != exactly))
            
            # 6) Add constraint for total number of truth-tellers
            solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
            
            # 7) Solve and extract model
            if solver.check() != sat:
                print(f"⚠️ Extreme puzzle attempt {attempt + 1} failed - no solution found, retrying...")
                continue  # Try again instead of recursively calling
            
            model = solver.model()
            solution = {p: bool(model[z3_vars[p]]) for p in people}
            
            # 8) Return the required dictionary
            print(f"✅ Extreme puzzle generated successfully on attempt {attempt + 1}")
            return {
                "num_players": num_players,
                "num_truth_tellers": num_truth_tellers,
                "statements": statements,
                "statement_logic": statement_logic,
                "solution": solution
            }
            
        except Exception as e:
            print(f"⚠️ Extreme puzzle attempt {attempt + 1} failed with error: {str(e)}, retrying...")
            continue
    
    # If we get here, all attempts failed
    print(f"❌ Failed to generate extreme puzzle after {max_attempts} attempts")
    raise RuntimeError(f"Failed to generate a valid extreme puzzle after {max_attempts} attempts")


def check_extreme_solution(data: dict) -> dict:
    """Check if a proposed solution is valid for an extreme puzzle."""
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
            
            implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
            solver.add(Implies(z3_vars[speaker], implication))
            solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
            
        elif logic["mode"] == "XOR":
            t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
            a1 = (z3_vars[t1] == c1)
            a2 = (z3_vars[t2] == c2)
            
            solver.add(Implies(z3_vars[speaker], Xor(a1, a2)))
            solver.add(Implies(Not(z3_vars[speaker]), Not(Xor(a1, a2))))
            
        elif logic["mode"] == "IFF":
            t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
            a1 = (z3_vars[t1] == c1)
            a2 = (z3_vars[t2] == c2)
            
            biconditional = And(Implies(a1, a2), Implies(a2, a1))
            solver.add(Implies(z3_vars[speaker], biconditional))
            solver.add(Implies(Not(z3_vars[speaker]), Not(biconditional)))
            
        elif logic["mode"] == "NESTED_IF":
            outer_cond = logic["outer_cond"]
            outer_val = logic["outer_val"]
            inner_cond = logic["inner_cond"]
            inner_val = logic["inner_val"]
            inner_result = logic["inner_result"]
            inner_result_val = logic["inner_result_val"]
            
            inner_impl = Implies(z3_vars[inner_cond] == inner_val, z3_vars[inner_result] == inner_result_val)
            nested_impl = Implies(z3_vars[outer_cond] == outer_val, inner_impl)
            
            solver.add(Implies(z3_vars[speaker], nested_impl))
            solver.add(Implies(Not(z3_vars[speaker]), Not(nested_impl)))
            
        elif logic["mode"] == "GROUP":
            members = logic["members"]
            exactly = logic["exactly"]
            
            cnt = Sum([If(z3_vars[m], 1, 0) for m in members])
            
            solver.add(Implies(z3_vars[speaker], cnt == exactly))
            solver.add(Implies(Not(z3_vars[speaker]), cnt != exactly))
    
    # 4) Add sum constraint
    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
    
    # 5) Constrain variables according to guess
    for person, value in guess.items():
        solver.add(z3_vars[person] == value)
    
    # 6) Check satisfiability
    return {"valid": solver.check() == sat} 