import os
import sys
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from z3 import Bool, Implies, Not, And, Or, Sum, If, Solver, sat

import easy_mode
import medium_mode
import hard_mode
import ranked_mode

# ─── Load env & init Flask ──────────────────────────────────────────────────
load_dotenv()  # reads .env or .flaskenv in your project root

print("→ SUPABASE_URL:",       os.getenv("SUPABASE_URL"))
print("→ SUPABASE_SERVICE_KEY:", bool(os.getenv("SUPABASE_SERVICE_KEY")))
print("→ SUPABASE_JWT_SECRET:",  bool(os.getenv("SUPABASE_JWT_SECRET")))

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:19006"], supports_credentials=True)

# ─── Init Supabase client (only URL + KEY) ──────────────────────────────────
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# ─── JWT Helpers ────────────────────────────────────────────────────────────
def verify_jwt(token: str) -> dict:
    try:
        user_resp = supabase.auth.get_user(token)
        if user_resp and user_resp.user:
            return {
                "sub":   user_resp.user.id,
                "email": user_resp.user.email
            }
    except Exception as e:
        print("JWT error:", e)
    return None

def get_or_create_profile(user_id: str, email: str) -> dict:
    r = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
    if r.data:
        return r.data[0]
    new = {"user_id": user_id, "elo": 1000, "email": email}
    i = supabase.table("profiles").insert(new).execute()
    return i.data[0] if i.data else new

def update_elo(user_id: str, elo: int):
    supabase.table("profiles").update({"elo": elo}).eq("user_id", user_id).execute()

def record_match(user_id, mode, success, time_taken, elo_before, elo_after):
    supabase.table("matches").insert({
        "user_id":    user_id,
        "mode":       mode,
        "solved":     success,
        "time_taken": time_taken,
        "elo_delta":  elo_after - elo_before
    }).execute()

def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kw):
        h = request.headers.get("Authorization","")
        if not h.startswith("Bearer "):
            return jsonify(error="Missing token"), 401
        t = h.split(" ",1)[1]
        u = verify_jwt(t)
        if not u:
            return jsonify(error="Invalid token"), 401
        profile = get_or_create_profile(u["sub"], u["email"])
        return f(user=u, profile=profile, *args, **kw)
    return wrapper

def auth_optional(f):
    @wraps(f)
    def wrapper(*args, **kw):
        h = request.headers.get("Authorization","")
        user = None
        profile = None
        if h.startswith("Bearer "):
            u = verify_jwt(h.split(" ",1)[1])
            if u:
                user = u
                profile = get_or_create_profile(u["sub"], u["email"])
        return f(user=user, profile=profile, *args, **kw)
    return wrapper

# ─── Health & Me ────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify(status="ok")

@app.route("/me")
@auth_required
def me(user, profile):
    return jsonify(user={"id": user["sub"], "email": user["email"], "elo": profile["elo"]})

# ─── Puzzle Endpoints ───────────────────────────────────────────────────────
@app.route("/puzzle/generate", methods=["POST"])
@auth_optional
def gen_puzzle(user, profile):
    data       = request.json or {}
    mode       = data.get("mode","easy")
    players    = data.get("players",4)
    if mode=="ranked" and not user:
        return jsonify(error="Auth required"), 401

    if mode=="easy":
        out = easy_mode.api_generate_easy(players)
    elif mode=="medium":
        out = medium_mode.api_generate_medium(players)
    elif mode=="hard":
        out = hard_mode.api_generate_hard(players)
    elif mode=="ranked":
        out = ranked_mode.api_generate_ranked()
    else:
        return jsonify(error="Invalid mode"), 400

    if profile:
        out["user_elo"] = profile["elo"]
    return jsonify(out)

@app.route("/puzzle/check", methods=["POST"])
@auth_optional
def check_puzzle(user, profile):
    data             = request.json or {}
    mode             = data.get("mode")
    guess            = data.get("guess",{})
    stmts            = data.get("statement_data",{})
    num_truth_tellers= data.get("num_truth_tellers",0)
    time_taken       = data.get("time_taken",0.0)

    if mode=="ranked" and not user:
        return jsonify(error="Auth required"), 401

    # build solver...
    people = list(stmts.keys())
    z3vars = {p: Bool(p) for p in people}
    solver = Solver()

    # add constraints
    for sp, s in stmts.items():
        m = s["mode"]
        if m=="DIRECT":
            tgt, claim = s["target"], s["truth_value"]
            solver.add(Implies(z3vars[sp], z3vars[tgt] == claim))
            solver.add(Implies(Not(z3vars[sp]), z3vars[tgt] != claim))
        elif m=="AND":
            solver.add(Implies(z3vars[sp],
                And(*[
                    (z3vars[t] if s[k] else Not(z3vars[t]))
                    for t,k in [(s["t1"],"c1"),(s["t2"],"c2")]
                ])
            ))
            solver.add(Implies(Not(z3vars[sp]),
                Or(*[
                    (z3vars[t] != s[k])
                    for t,k in [(s["t1"],"c1"),(s["t2"],"c2")]
                ])
            ))
        elif m=="OR":
            solver.add(Implies(z3vars[sp],
                Or(*[
                    (z3vars[t] if s[k] else Not(z3vars[t]))
                    for t,k in [(s["t1"],"c1"),(s["t2"],"c2")]
                ])
            ))
            solver.add(Implies(Not(z3vars[sp]),
                And(*[
                    (z3vars[t] != s[k])
                    for t,k in [(s["t1"],"c1"),(s["t2"],"c2")]
                ])
            ))
        elif m=="IF":
            c,cv = s["cond"], s["cond_val"]
            r,rv = s["result"], s["result_val"]
            impl = Implies(z3vars[c]==cv, z3vars[r]==rv)
            solver.add(Implies(z3vars[sp], impl))
            solver.add(Implies(Not(z3vars[sp]), Not(impl)))

    # count
    solver.add(Sum([If(z3vars[p],1,0) for p in people])==num_truth_tellers)
    # apply guess
    for p,b in guess.items():
        solver.add(z3vars[p]==b)

    valid = solver.check()==sat
    response = {"valid": valid}

    if mode=="ranked" and user and profile:
        old = profile["elo"]
        # you can plug your own delta logic here:
        delta = ranked_mode.compute_elo_delta(old, len(people), time_taken, valid)
        new  = max(0, old+delta)
        update_elo(user["sub"], new)
        record_match(user["sub"], mode, valid, time_taken, old, new)
        response["elo_change"] = {"old": old, "new": new, "delta": delta}

    return jsonify(response)

if __name__=="__main__":
    app.run(debug=True)
