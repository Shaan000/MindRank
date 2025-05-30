import random
from z3 import *

def api_generate_easy(num_players):
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
        actual = z3_vars[target] if said_truth else Not(z3_vars[target])
        solver.add(Implies(z3_vars[speaker], actual))
        solver.add(Implies(Not(z3_vars[speaker]), Not(actual)))

    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

    if solver.check() == sat:
        model = solver.model()
        solution = {p: bool(model[z3_vars[p]]) for p in people}

        return {
            "num_players": num_players,
            "num_truth_tellers": num_truth_tellers,
            "statements": {p: statements[p]["text"] for p in people},
            "statement_data": {p: {
                "target": statements[p]["target"],
                "truth_value": statements[p]["truth_value"]
            } for p in people},
            "solution": solution
        }
    else:
        return {"error": "No valid solution found."}

def check_easy_solution(data):
    statements = data["statement_data"]
    guess = data["guess"]
    num_truth_tellers = data["num_truth_tellers"]
    people = list(statements.keys())

    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()

    for speaker, sdata in statements.items():
        target = sdata["target"]
        said_truth = sdata["truth_value"]
        actual = z3_vars[target] if said_truth else Not(z3_vars[target])
        solver.add(Implies(z3_vars[speaker], actual))
        solver.add(Implies(Not(z3_vars[speaker]), Not(actual)))

    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

    for person, is_truth in guess.items():
        solver.add(z3_vars[person] == is_truth)

    return {"valid": solver.check() == sat}
