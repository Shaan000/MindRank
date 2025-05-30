import random
from z3 import *

def api_generate_hard(num_players):
    people = [chr(ord('A') + i) for i in range(num_players)]
    num_truth_tellers = max(2, round(0.6 * num_players))
    truth_teller_set = set(random.sample(people, num_truth_tellers))
    roles = {p: p in truth_teller_set for p in people}

    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()

    def generate_valid_statements(roles):
        while True:
            statements = {}
            has_if = False
            for speaker in people:
                others = [p for p in people if p != speaker]
                mode = random.choice(["AND", "OR", "DIRECT", "IF"])

                if mode == "IF" or (not has_if and speaker == people[-1]):
                    has_if = True
                    cond, result = random.sample(others, 2)
                    cond_val = random.choice([True, False])
                    result_val = random.choice([True, False])
                    implication = Implies(z3_vars[cond] if cond_val else Not(z3_vars[cond]),
                                          z3_vars[result] if result_val else Not(z3_vars[result]))
                    logic = implication if roles[speaker] else Not(implication)
                    sentence = f"If {cond} is {'True' if cond_val else 'False'}, then {result} is {'True' if result_val else 'False'}."
                    statements[speaker] = {"text": sentence, "details": {
                        "mode": "IF",
                        "cond": cond,
                        "cond_val": cond_val,
                        "result": result,
                        "result_val": result_val
                    }}
                    continue

                if mode == "DIRECT":
                    target = random.choice(others)
                    actual = roles[target]
                    claim = actual if roles[speaker] else not actual
                    logic = z3_vars[target] if claim else Not(z3_vars[target])
                    sentence = f"{target} is a {'Truth-Teller' if claim else 'Liar'}."
                    details = {"mode": "DIRECT", "target": target, "claim": claim}

                elif mode == "AND":
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    c1 = actual1 if roles[speaker] else not actual1
                    c2 = actual2 if roles[speaker] else not actual2
                    logic = And(z3_vars[t1] if c1 else Not(z3_vars[t1]),
                                z3_vars[t2] if c2 else Not(z3_vars[t2]))
                    sentence = f"{t1} is a {'Truth-Teller' if c1 else 'Liar'} AND {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    details = {"mode": "AND", "t1": t1, "t2": t2, "c1": c1, "c2": c2}

                else:  # OR
                    t1, t2 = random.sample(others, 2)
                    actual1, actual2 = roles[t1], roles[t2]
                    c1 = actual1 if roles[speaker] else not actual1
                    c2 = actual2 if roles[speaker] else not actual2
                    logic = Or(z3_vars[t1] if c1 else Not(z3_vars[t1]),
                               z3_vars[t2] if c2 else Not(z3_vars[t2]))
                    sentence = f"{t1} is a {'Truth-Teller' if c1 else 'Liar'} OR {t2} is a {'Truth-Teller' if c2 else 'Liar'}."
                    details = {"mode": "OR", "t1": t1, "t2": t2, "c1": c1, "c2": c2}

                statements[speaker] = {"text": sentence, "details": details}

            solver.reset()
            for speaker, content in statements.items():
                d = content["details"]
                if d["mode"] == "IF":
                    logic = Implies(z3_vars[d["cond"]] if d["cond_val"] else Not(z3_vars[d["cond"]]),
                                    z3_vars[d["result"]] if d["result_val"] else Not(z3_vars[d["result"]]))
                elif d["mode"] == "DIRECT":
                    logic = z3_vars[d["target"]] if d["claim"] else Not(z3_vars[d["target"]])
                elif d["mode"] == "AND":
                    logic = And(z3_vars[d["t1"]] if d["c1"] else Not(z3_vars[d["t1"]]),
                                z3_vars[d["t2"]] if d["c2"] else Not(z3_vars[d["t2"]]))
                else:  # OR
                    logic = Or(z3_vars[d["t1"]] if d["c1"] else Not(z3_vars[d["t1"]]),
                               z3_vars[d["t2"]] if d["c2"] else Not(z3_vars[d["t2"]]))
                solver.add(Implies(z3_vars[speaker], logic))
                solver.add(Implies(Not(z3_vars[speaker]), Not(logic)))

            solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

            if solver.check() == sat:
                return statements

    statements = generate_valid_statements(roles)

    for speaker, content in statements.items():
        d = content["details"]
        if d["mode"] == "IF":
            logic = Implies(z3_vars[d["cond"]] if d["cond_val"] else Not(z3_vars[d["cond"]]),
                            z3_vars[d["result"]] if d["result_val"] else Not(z3_vars[d["result"]]))
        elif d["mode"] == "DIRECT":
            logic = z3_vars[d["target"]] if d["claim"] else Not(z3_vars[d["target"]])
        elif d["mode"] == "AND":
            logic = And(z3_vars[d["t1"]] if d["c1"] else Not(z3_vars[d["t1"]]),
                        z3_vars[d["t2"]] if d["c2"] else Not(z3_vars[d["t2"]]))
        else:
            logic = Or(z3_vars[d["t1"]] if d["c1"] else Not(z3_vars[d["t1"]]),
                       z3_vars[d["t2"]] if d["c2"] else Not(z3_vars[d["t2"]]))
        solver.add(Implies(z3_vars[speaker], logic))
        solver.add(Implies(Not(z3_vars[speaker]), Not(logic)))

    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

    if solver.check() == sat:
        model = solver.model()
        solution = {p: bool(model[z3_vars[p]]) for p in people}

        return {
            "num_players": num_players,
            "num_truth_tellers": num_truth_tellers,
            "statements": {p: statements[p]["text"] for p in people},
            "statement_data": {p: statements[p]["details"] for p in people},
            "solution": solution
        }
    else:
        return {"error": "No valid solution found."}

def check_hard_solution(data):
    statements = data["statement_data"]
    guess = data["guess"]
    num_truth_tellers = data["num_truth_tellers"]
    people = list(statements.keys())

    z3_vars = {p: Bool(p) for p in people}
    solver = Solver()

    for speaker, d in statements.items():
        if d["mode"] == "IF":
            logic = Implies(z3_vars[d["cond"]] if d["cond_val"] else Not(z3_vars[d["cond"]]),
                            z3_vars[d["result"]] if d["result_val"] else Not(z3_vars[d["result"]]))
        elif d["mode"] == "DIRECT":
            logic = z3_vars[d["target"]] if d["claim"] else Not(z3_vars[d["target"]])
        elif d["mode"] == "AND":
            logic = And(z3_vars[d["t1"]] if d["c1"] else Not(z3_vars[d["t1"]]),
                        z3_vars[d["t2"]] if d["c2"] else Not(z3_vars[d["t2"]]))
        else:
            logic = Or(z3_vars[d["t1"]] if d["c1"] else Not(z3_vars[d["t1"]]),
                       z3_vars[d["t2"]] if d["c2"] else Not(z3_vars[d["t2"]]))

        solver.add(Implies(z3_vars[speaker], logic))
        solver.add(Implies(Not(z3_vars[speaker]), Not(logic)))

    solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)

    for person, is_truth in guess.items():
        solver.add(z3_vars[person] == is_truth)

    return {"valid": solver.check() == sat}
