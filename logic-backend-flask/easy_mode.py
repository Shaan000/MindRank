import random
from z3 import *

def api_generate_easy(num_players):
    """Generate an easy puzzle with DIRECT statements only."""
    max_attempts = 10  # Prevent infinite loops
    
    for attempt in range(max_attempts):
        try:
            people = [chr(ord('A') + i) for i in range(num_players)]
            num_truth_tellers = max(2, round(0.6 * num_players))
            truth_teller_set = set(random.sample(people, num_truth_tellers))
            roles = {p: p in truth_teller_set for p in people}

            truth_teller_statements = {}

            def generate_statements(roles):
                statements = {}
                for speaker in roles:
                    possible_targets = [p for p in roles if p != speaker]
                    if roles[speaker]:
                        random.shuffle(possible_targets)
                        for target in possible_targets:
                            said_truth = roles[target]
                            if target in truth_teller_statements and truth_teller_statements[target] != said_truth:
                                continue
                            truth_teller_statements[target] = said_truth
                            break
                    else:
                        target = random.choice(possible_targets)
                        said_truth = not roles[target]
                    sentence = f"{target} is a {'Truth-Teller' if said_truth else 'Liar'}."
                    statements[speaker] = {
                        "text": sentence,
                        "target": target,
                        "truth_value": said_truth
                    }
                return statements

            statements = generate_statements(roles)
            z3_vars = {p: Bool(p) for p in people}
            solver = Solver()

            for speaker, data in statements.items():
                target = data["target"]
                said_truth = data["truth_value"]
                
                solver.add(Implies(z3_vars[speaker], z3_vars[target] == said_truth))
                
                solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != said_truth))

            solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

            if solver.check() != sat:
                print(f"⚠️ Easy puzzle attempt {attempt + 1} failed - no solution found, retrying...")
                continue  # Try again instead of returning error
            
            model = solver.model()
            solution = {p: bool(model[z3_vars[p]]) for p in people}

            print(f"✅ Easy puzzle generated successfully on attempt {attempt + 1}")
            return {
                "puzzle_id": f"easy_{num_players}_{random.randint(1000, 9999)}",
                "num_players": num_players,
                "num_truth_tellers": num_truth_tellers,
                "statements": {p: statements[p]["text"] for p in people},
                "statement_data": {p: {
                    "target": statements[p]["target"],
                    "truth_value": statements[p]["truth_value"]
                } for p in people},
                "solution": solution
            }
            
        except Exception as e:
            print(f"⚠️ Easy puzzle attempt {attempt + 1} failed with error: {str(e)}, retrying...")
            continue
    
    # If we get here, all attempts failed
    print(f"❌ Failed to generate easy puzzle after {max_attempts} attempts")
    raise RuntimeError(f"Failed to generate a valid easy puzzle after {max_attempts} attempts")

def check_easy_solution(data):
    player_assignments = data.get("player_assignments") or data.get("guess", {})
    statement_data = data.get("statement_data", {})
    num_truth_tellers = data.get("num_truth_tellers")
    
    if not statement_data:
        return {"valid": False, "error": "Missing statement_data"}
    if not player_assignments:
        return {"valid": False, "error": "Missing player assignments"}
    if num_truth_tellers is None:
        return {"valid": False, "error": "Missing num_truth_tellers"}
    
    people = list(statement_data.keys())
    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()

    for speaker, sdata in statement_data.items():
        target = sdata["target"]
        said_truth = sdata["truth_value"]
        
        solver.add(Implies(z3_vars[speaker], z3_vars[target] == said_truth))
        
        solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != said_truth))

    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

    for person, is_truth in player_assignments.items():
        solver.add(z3_vars[person] == is_truth)

    result = solver.check()
    return {"valid": result == sat}
