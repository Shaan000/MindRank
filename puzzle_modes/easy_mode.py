import random
from z3 import Solver, Bool, Implies, Not, Sum, If, sat

def api_generate_easy(num_players: int) -> dict:
    """Generate an easy puzzle with only DIRECT statements."""
    # 1) Build generic labels: ["A", "B", …]
    people = [chr(ord('A') + i) for i in range(num_players)]
    
    # 2) Compute num_truth_tellers = max(2, round(0.6 * num_players))
    num_truth_tellers = max(2, round(0.6 * num_players))
    
    # 3) Randomly pick which labels are TRUTH-TELLERS
    truth_teller_set = set(random.sample(people, num_truth_tellers))
    roles = {p: p in truth_teller_set for p in people}
    
    # Initialize data structures
    statements = {}
    statement_logic = {}
    
    # 4) For each speaker, create a DIRECT statement
    for speaker in people:
        others = [p for p in people if p != speaker]
        target = random.choice(others)
        
        # If speaker is Truth-Teller, they tell the truth about target
        # If speaker is Liar, they lie about target
        actual = roles[target]
        claim = actual if roles[speaker] else not actual
        
        # Build statement text
        statement_text = f"{target} is a {'Truth-Teller' if claim else 'Liar'}."
        statements[speaker] = statement_text
        
        # Build statement logic
        statement_logic[speaker] = {
            "mode": "DIRECT",
            "target": target,
            "claim": claim
        }
    
    # 5) Create Z3 Solver and add constraints
    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()
    
    for speaker in people:
        logic = statement_logic[speaker]
        target = logic["target"]
        claim = logic["claim"]
        
        # If speaker is truth-teller, target must match claim
        solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
        # If speaker is liar, target must be opposite of claim
        solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] == (not claim)))
    
    # 6) Add constraint for total number of truth-tellers
    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
    
    # 7) Solve and extract model
    if solver.check() != sat:
        # This should be very rare, but retry if needed
        return api_generate_easy(num_players)
    
    model = solver.model()
    solution = {p: bool(model[z3_vars[p]]) for p in people}
    
    # 8) Return the required dictionary
    return {
        "num_players": num_players,
        "num_truth_tellers": num_truth_tellers,
        "statements": statements,
        "statement_logic": statement_logic,
        "solution": solution
    }


def check_easy_solution(data: dict) -> dict:
    """Check if a proposed solution is valid for an easy puzzle."""
    # 1) Read data
    statement_logic = data["statement_logic"]
    num_truth_tellers = data["num_truth_tellers"]
    guess = data["guess"]
    
    # 2) Create z3_vars for each person
    people = list(statement_logic.keys())
    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()
    
    # 3) Re-apply the exact same DIRECT constraints
    for speaker, logic in statement_logic.items():
        if logic["mode"] == "DIRECT":
            target = logic["target"]
            claim = logic["claim"]
            
            # Same constraints as in generation
            solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
            solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] == (not claim)))
    
    # 4) Add sum constraint
    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
    
    # 5) Constrain variables according to guess
    for person, value in guess.items():
        solver.add(z3_vars[person] == value)
    
    # 6) Check satisfiability
    return {"valid": solver.check() == sat} 