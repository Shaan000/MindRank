import random
from z3 import Solver, Bool, And, Or, Implies, Not, Sum, If, sat

def api_generate_medium(num_players: int) -> dict:
    """Generate a medium puzzle with DIRECT, AND, OR statements."""
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
    
    # 4) For each speaker, pick mode and create statement
    for speaker in people:
        others = [p for p in people if p != speaker]
        mode = random.choice(["DIRECT", "AND", "OR"])
        
        if mode == "DIRECT":
            # Same as easy mode
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
            # Pick 2 distinct others
            t1, t2 = random.sample(others, 2)
            actual1, actual2 = roles[t1], roles[t2]
            
            # If speaker is truth-teller, claims match reality; if liar, at least one claim is wrong
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
            # Pick 2 distinct others
            t1, t2 = random.sample(others, 2)
            actual1, actual2 = roles[t1], roles[t2]
            
            # If speaker is truth-teller, at least one claim is right; if liar, both claims are wrong
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
            # Truth-teller: both claims must be true
            solver.add(Implies(z3_vars[speaker], And(z3_vars[t1] == c1, z3_vars[t2] == c2)))
            # Liar: at least one claim must be false
            solver.add(Implies(Not(z3_vars[speaker]), Not(And(z3_vars[t1] == c1, z3_vars[t2] == c2))))
            
        elif logic["mode"] == "OR":
            t1, c1, t2, c2 = logic["t1"], logic["c1"], logic["t2"], logic["c2"]
            # Truth-teller: at least one claim must be true
            solver.add(Implies(z3_vars[speaker], Or(z3_vars[t1] == c1, z3_vars[t2] == c2)))
            # Liar: both claims must be false
            solver.add(Implies(Not(z3_vars[speaker]), Not(Or(z3_vars[t1] == c1, z3_vars[t2] == c2))))
    
    # 6) Add constraint for total number of truth-tellers
    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
    
    # 7) Solve and extract model
    if solver.check() != sat:
        # Retry if unsatisfiable (should be rare)
        return api_generate_medium(num_players)
    
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


def check_medium_solution(data: dict) -> dict:
    """Check if a proposed solution is valid for a medium puzzle."""
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
    
    # 4) Add sum constraint
    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
    
    # 5) Constrain variables according to guess
    for person, value in guess.items():
        solver.add(z3_vars[person] == value)
    
    # 6) Check satisfiability
    return {"valid": solver.check() == sat} 