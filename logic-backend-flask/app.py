import os
import random
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client
from z3 import Bool, And, Or, Xor, Implies, Not, Sum, If, Solver, sat
from dotenv import load_dotenv
from functools import wraps
import jwt
import sys
import datetime

# Import puzzle mode modules (they are in the same directory)
import easy_mode
import medium_mode  
import hard_mode

# Add the parent directory to sys.path to import from puzzle_modes
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
puzzle_modes_dir = os.path.join(parent_dir, 'puzzle_modes')
if puzzle_modes_dir not in sys.path:
    sys.path.append(puzzle_modes_dir)

try:
    import extreme_mode
    EXTREME_MODE_AVAILABLE = True
    print("✅ Extreme mode imported successfully")
    # Test if the function exists
    if hasattr(extreme_mode, 'api_generate_extreme'):
        print("✅ api_generate_extreme function found")
    else:
        print("❌ api_generate_extreme function NOT found")
        EXTREME_MODE_AVAILABLE = False
except ImportError as e:
    print(f"⚠️  Extreme mode not available: {e}")
    EXTREME_MODE_AVAILABLE = False

# Import elo system
from elo_system import (
    get_tier, 
    get_valid_modes_for_tier, 
    compute_elo_change, 
    get_random_puzzle_config,
    get_random_puzzle_config_for_unranked,
    update_hidden_elo,
    reveal_placement_elo,
    calculate_dynamic_time_limit,
    is_placement_match,
    compute_placement_elo_change,
    calculate_final_placement_elo,
    PLACEMENT_MATCHES_REQUIRED,
    DEFAULT_HIDDEN_ELO
)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, origins=["https://mindrank.net", "https://www.mindrank.net", "https://mind-rank.vercel.app"])

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY") 
supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

# Check if required environment variables are set
if not supabase_url or not supabase_key or not supabase_jwt_secret:
    print("⚠️  Warning: Supabase environment variables not configured!")
    print("   - Practice mode will work, but authentication features will be disabled")
    print("   - Please set SUPABASE_URL, SUPABASE_SERVICE_KEY, and SUPABASE_JWT_SECRET in .env file")
    supabase = None
else:
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {e}")
        supabase = None

def verify_jwt(token: str) -> dict:
    """Verify JWT token and return user info."""
    if not supabase or not supabase_jwt_secret:
        print("❌ Cannot verify JWT: Supabase not configured")
        return None
        
    try:
        # Decode the JWT token
        payload = jwt.decode(token, supabase_jwt_secret, algorithms=["HS256"])
        return {"sub": payload.get("sub"), "email": payload.get("email")}
    except jwt.InvalidTokenError:
        try:
            # Try using Supabase auth verification as fallback
            response = supabase.auth.get_user(token)
            if response.user:
                return {"sub": response.user.id, "email": response.user.email}
        except Exception as e:
            print(f"❌ Supabase auth verification failed: {e}")
        return None

def get_or_create_user_profile(user_id: str, email: str) -> dict:
    """Get user profile from database or create if doesn't exist."""
    if not supabase:
        print("❌ Cannot access user profile: Supabase not configured")
        return {"user_id": user_id, "email": email, "elo": 1000, "username": email.split('@')[0] if email else "User"}
        
    try:
        # Query profiles table
        profiles = supabase.table("profiles").select("*").eq("user_id", user_id).execute()
        if profiles.data:
            profile = profiles.data[0]
            # Initialize username if it doesn't exist
            if not profile.get("username"):
                username = email.split('@')[0] if email else "User"
                try:
                    supabase.table("profiles").update({"username": username}).eq("user_id", user_id).execute()
                    profile["username"] = username
                except Exception as e:
                    print(f"Failed to initialize username: {e}")
                    profile["username"] = username
            return profile
        
        # Create new profile if doesn't exist
        username = email.split('@')[0] if email else "User"
        new_profile = {
            "user_id": user_id, 
            "email": email, 
            "elo": None,  # Start as unranked 
            "hidden_elo": 750,  # Default hidden ELO for placement matches
            "username": username,
            "placement_matches_completed": 0,
            "is_ranked": False,
            # Practice mode progress tracking
            "easy_puzzles_solved": 0,
            "medium_puzzles_solved": 0,
            "hard_puzzles_solved": 0,
            "extreme_puzzles_solved": 0,
            # Master mode progress tracking (separate from practice mode)
            "master_easy_puzzles_solved": 0,
            "master_medium_puzzles_solved": 0,
            "master_hard_puzzles_solved": 0,
            "master_extreme_puzzles_solved": 0
        }
        inserted = supabase.table("profiles").insert(new_profile).execute()
        return inserted.data[0] if inserted.data else new_profile
    except Exception as e:
        print(f"Error getting/creating user profile: {e}")
        username = email.split('@')[0] if email else "User"
        return {"user_id": user_id, "email": email, "elo": 1000, "username": username}

def auth_required(f):
    """Decorator that requires authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "No token provided"}), 401
        
        token = auth_header.split(" ")[1]
        user = verify_jwt(token)
        if not user:
            return jsonify({"error": "Invalid token"}), 401
        
        profile = get_or_create_user_profile(user["sub"], user.get("email", ""))
        return f(*args, user=user, profile=profile, **kwargs)
    return decorated

def auth_optional(f):
    """Decorator that allows optional authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        user = None
        profile = None
        
        if auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                user = verify_jwt(token)
                if user:
                    profile = get_or_create_user_profile(user["sub"], user.get("email", ""))
            except Exception as e:
                print(f"⚠️  Authentication failed in auth_optional: {e}")
                # Continue without authentication - practice mode should still work
                user = None
                profile = None
        
        return f(*args, user=user, profile=profile, **kwargs)
    return decorated

@app.route("/puzzle/generate", methods=["GET"])
def generate_puzzle_get():
    """GET endpoint for generating puzzles (practice mode)."""
    mode = request.args.get('mode', 'easy').lower()
    players = int(request.args.get('players', 4))
    
    try:
        if mode == "easy":
            result = easy_mode.api_generate_easy(players)
        elif mode == "medium":
            result = medium_mode.api_generate_medium(players)
        elif mode == "hard":
            result = hard_mode.api_generate_hard(players)
        elif mode == "extreme" and EXTREME_MODE_AVAILABLE:
            result = extreme_mode.api_generate_extreme(players)
        elif mode == "extreme" and not EXTREME_MODE_AVAILABLE:
            return jsonify({"error": "Extreme mode not available on this server"}), 400
        else:
            return jsonify({"error": "Invalid mode"}), 400
    except RuntimeError as e:
        print(f"❌ Puzzle generation failed after multiple attempts: {str(e)}")
        return jsonify({"error": "Unable to generate a solvable puzzle. Please try again."}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to generate puzzle: {str(e)}"}), 500
    
    return jsonify(result)

@app.route("/puzzle/generate", methods=["POST"])
@auth_optional
def generate_puzzle(user, profile):
    """Generate a puzzle with optional authentication for ranked mode."""
    print(f"🚀 POST /puzzle/generate endpoint reached!")
    
    data = request.json or {}
    mode = data.get("mode", "Easy")
    players = data.get("players")
    
    print(f"🎯 POST /puzzle/generate - mode: {mode}, players: {players}, user: {user is not None}, profile: {profile is not None}")
    print(f"🔍 DEBUG - Original mode: '{mode}', Lowercased: '{mode.lower()}'")
    print(f"🔍 DEBUG - EXTREME_MODE_AVAILABLE: {EXTREME_MODE_AVAILABLE}")
    print(f"🔍 DEBUG - Full request data: {data}")
    
    # Handle ranked mode
    if mode.lower() == "ranked":
        if not user:
            print("❌ Ranked mode requires authentication but user is None")
            return jsonify({"error": "Authentication required for ranked mode"}), 401
        
        # Get random puzzle configuration based on user's tier
        tier_mode, tier_players = get_random_puzzle_config(profile["elo"])
        if not tier_mode:
            return jsonify({"error": "No valid puzzles for your tier"}), 400
        
        mode = tier_mode
        players = tier_players
        print(f"🎲 Ranked mode puzzle: {mode} with {players} players")
    
    # Validate players parameter
    if not players:
        players = 4  # Default
        print(f"🔢 Using default player count: {players}")
    
    print(f"🚀 Generating {mode} puzzle with {players} players")
    
    # Generate puzzle based on mode
    try:
        print(f"🔍 DEBUG - Checking mode: '{mode.lower()}'")
        if mode.lower() == "easy":
            print(f"✅ Matched: easy mode")
            result = easy_mode.api_generate_easy(players)
        elif mode.lower() == "medium":
            print(f"✅ Matched: medium mode")
            result = medium_mode.api_generate_medium(players)
        elif mode.lower() == "hard":
            print(f"✅ Matched: hard mode")
            result = hard_mode.api_generate_hard(players)
        elif mode.lower() == "extreme":
            print(f"✅ Matched: extreme mode")
            if EXTREME_MODE_AVAILABLE:
                print(f"🌟 Generating extreme mode puzzle")
                result = extreme_mode.api_generate_extreme(players)
            else:
                print(f"❌ Extreme mode requested but not available")
                return jsonify({"error": "Extreme mode not available on this server"}), 400
        else:
            print(f"❌ No match found for mode: '{mode}' (lowercased: '{mode.lower()}')")
            return jsonify({"error": f"Invalid mode: {mode}"}), 400
        
        print(f"✅ Puzzle generated successfully for {mode} mode")
    except RuntimeError as e:
        print(f"❌ Puzzle generation failed after multiple attempts: {str(e)}")
        return jsonify({"error": "Unable to generate a solvable puzzle. Please try again."}), 500
    except Exception as e:
        print(f"❌ Failed to generate puzzle: {str(e)}")
        return jsonify({"error": f"Failed to generate puzzle: {str(e)}"}), 500
    
    # Add tier-specific information if authenticated
    if profile:
        # For unranked users, use hidden_elo; for ranked users, use regular elo
        effective_elo = profile.get("elo") if profile.get("elo") is not None else profile.get("hidden_elo", DEFAULT_HIDDEN_ELO)
        is_unranked = profile.get("elo") is None
        
        tier = get_tier(effective_elo)
        if tier:
            # Use dynamic time limit based on mode and number of players
            time_limit = calculate_dynamic_time_limit(mode.capitalize(), players)
            difficulty_mult = tier["difficulty_mult"].get(mode.capitalize(), 1.0)
            result["time_limit"] = time_limit
            result["difficulty_mult"] = difficulty_mult
            result["user_elo"] = profile.get("elo")  # Keep this as None for unranked users
            result["hidden_elo"] = profile.get("hidden_elo") if is_unranked else None
            result["is_placement_match"] = is_placement_match(profile)
            
            if is_unranked:
                placement_completed = profile.get("placement_matches_completed", 0)
                result["placement_match_number"] = placement_completed + 1
                print(f"📊 Added tier info for UNRANKED user - Tier: '{tier['label']}' (Hidden ELO: {effective_elo}) | Mode: {mode.capitalize()} | Players: {players} | Time Limit: {time_limit}s | Placement Match: {placement_completed + 1}/5")
            else:
                print(f"📊 Added tier info for RANKED user - Tier: '{tier['label']}' (ELO: {effective_elo}) | Mode: {mode.capitalize()} | Players: {players} | Time Limit: {time_limit}s | Difficulty: {difficulty_mult}x")
        else:
            print(f"⚠️ Could not determine tier for ELO {effective_elo}")
        
        # Add practice mode progress for non-ranked modes
        if mode.lower() != "ranked":
            try:
                mode_column_map = {
                    "easy": "easy_puzzles_solved",
                    "medium": "medium_puzzles_solved", 
                    "hard": "hard_puzzles_solved",
                    "extreme": "extreme_puzzles_solved"
                }
                
                column_name = mode_column_map.get(mode.lower())
                if column_name:
                    current_progress = profile.get(column_name, 0)
                    result["practice_progress"] = {
                        "mode": mode.lower(),
                        "solved": current_progress,
                        "total": 10,
                        "percentage": (current_progress / 10) * 100
                    }
                    
                    # Check proper unlock status for this mode
                    unlock_requirements = {
                        "easy": True,  # Always unlocked
                        "medium": profile.get("easy_puzzles_solved", 0) >= 10,
                        "hard": profile.get("medium_puzzles_solved", 0) >= 10,
                        "extreme": profile.get("hard_puzzles_solved", 0) >= 10 and EXTREME_MODE_AVAILABLE
                    }
                    
                    result["mode_unlocked"] = unlock_requirements.get(mode.lower(), False)
                    
                    print(f"📊 Practice Progress: {mode.lower()} {current_progress}/10 - Unlocked: {result['mode_unlocked']}")
                    
            except Exception as e:
                print(f"⚠️ Failed to add practice progress info: {e}")
    else:
        print("ℹ️ No profile found - using default time limits")
    
    print(f"🎉 Returning puzzle result for {mode} mode")
    return jsonify(result)

@app.route("/puzzle/check", methods=["POST"])
@auth_optional  
def check_solution(user, profile):
    """Check puzzle solution with optional Elo updates for ranked mode."""
    try:
        data = request.json or {}
        print(f"🔍 /puzzle/check received data: {data}")
        
        mode = data.get("mode")
        # Handle both 'player_assignments' (from React) and 'guess' (legacy) formats
        guess = data.get("player_assignments") or data.get("guess", {})
        statement_data = data.get("statement_data", {})
        num_truth_tellers = data.get("num_truth_tellers")
        time_taken = data.get("time_taken", 0)
        gave_up = data.get("gave_up", False)
        abandoned = data.get("abandoned", False)
        
        # New field to track if this is the first attempt for this puzzle
        is_first_attempt = data.get("is_first_attempt", True)
        
        print(f"🔍 Checking solution for mode: {mode} (ranked: {mode.lower() == 'ranked'})")
        print(f"🎯 First attempt: {is_first_attempt}")
        print(f"👤 User authenticated: {user is not None}")
        print(f"📊 Guess: {guess}")
        print(f"🎪 Abandoned: {abandoned}, Gave up: {gave_up}")
        
        if abandoned:
            print(f"🚪 User abandoned puzzle - no progress tracking")
        
        # Check if this is ranked mode
        is_ranked = mode and mode.lower() == "ranked"
        
        if is_ranked and not user:
            return jsonify({"error": "Authentication required for ranked mode"}), 401
        
        # For non-ranked modes, use the existing check functions
        if not is_ranked:
            try:
                if mode.lower() == "easy":
                    result = easy_mode.check_easy_solution(data)
                elif mode.lower() == "medium":
                    result = medium_mode.check_medium_solution(data)
                elif mode.lower() == "hard":
                    result = hard_mode.check_hard_solution(data)
                elif mode.lower() == "extreme" and EXTREME_MODE_AVAILABLE:
                    result = extreme_mode.check_extreme_solution(data)
                elif mode.lower() == "extreme" and not EXTREME_MODE_AVAILABLE:
                    return jsonify({"error": "Extreme mode not available on this server"}), 400
                else:
                    return jsonify({"error": "Invalid mode"}), 400
                
                print(f"✅ Check result: {result}")
                
                # Add first-try success message for all users (authenticated or not)
                if result.get("valid", False) and is_first_attempt:
                    first_try_messages = [
                        "🧠 Sharp brain, awesome job!",
                        "⚡ Lightning-fast thinking!",
                        "🎯 Perfect logic on first try!",
                        "🌟 Brilliant deduction skills!",
                        "🔥 First-try mastery!",
                        "💎 Flawless logical reasoning!",
                        "🚀 Outstanding problem-solving!",
                        "🏆 First-attempt excellence!"
                    ]
                    import random
                    result["first_try_message"] = random.choice(first_try_messages)
                
                # Track practice mode progress for authenticated users
                if user and profile and supabase and result.get("valid", False) and is_first_attempt and not gave_up:
                    try:
                        # Determine if this is master mode or practice mode
                        is_master_mode = data.get("is_master_mode", False)
                        
                        if is_master_mode:
                            # Master mode progress tracking
                            mode_column_map = {
                                "easy": "master_easy_puzzles_solved",
                                "medium": "master_medium_puzzles_solved", 
                                "hard": "master_hard_puzzles_solved",
                                "extreme": "master_extreme_puzzles_solved"
                            }
                        else:
                            # Practice mode progress tracking
                            mode_column_map = {
                                "easy": "easy_puzzles_solved",
                                "medium": "medium_puzzles_solved", 
                                "hard": "hard_puzzles_solved",
                                "extreme": "extreme_puzzles_solved"
                            }
                        
                        column_name = mode_column_map.get(mode.lower())
                        if column_name:
                            current_count = profile.get(column_name, 0)
                            
                            # Only increment if this is a first-try success
                            if current_count < 10:
                                new_count = current_count + 1
                                
                                mode_type = "Master" if is_master_mode else "Practice"
                                print(f"📈 {mode_type} Progress (FIRST TRY): {mode.lower()} {current_count} → {new_count}")
                                
                                # Update the database
                                update_result = supabase.table("profiles") \
                                    .update({column_name: new_count}) \
                                    .eq("user_id", user["sub"]) \
                                    .execute()
                                
                                print(f"✅ Updated {mode_type.lower()} {mode.lower()} progress: {new_count}/10 puzzles solved on first try")
                                
                                # Add progress info to the result
                                result["practice_progress"] = {
                                    "mode": mode.lower(),
                                    "solved": new_count,
                                    "total": 10,
                                    "percentage": (new_count / 10) * 100,
                                    "is_master_mode": is_master_mode
                                }
                                
                                # Check if user unlocked next mode
                                if new_count == 10:
                                    if is_master_mode:
                                        unlock_messages = {
                                            "easy": "🏆 Master Medium mode unlocked! Your deduction skills are remarkable!",
                                            "medium": "🏆 Master Hard mode unlocked! Logic mastery at its finest!",
                                            "hard": "🏆 Master Extreme mode unlocked! Prepare for the ultimate mental challenge!",
                                            "extreme": "👑 LEGENDARY! You've conquered all Master modes! True logic mastery achieved!"
                                        }
                                    else:
                                        unlock_messages = {
                                            "easy": "🎉 Medium mode unlocked! You've mastered the basics!",
                                            "medium": "🎉 Hard mode unlocked! Ready for complex logic puzzles!",
                                            "hard": "🎉 Extreme mode unlocked! Prepare for the ultimate challenge!",
                                            "extreme": "🏆 Congratulations! You've completed all practice modes!"
                                        }
                                    result["unlock_message"] = unlock_messages.get(mode.lower())
                            else:
                                print(f"📊 Practice Progress: {mode.lower()} already at maximum (10/10) - not tracking further")
                        
                    except Exception as e:
                        print(f"⚠️ Failed to update practice progress: {e}")
                        # Don't fail the whole request if progress tracking fails
                elif user and profile and result.get("valid", False) and not is_first_attempt:
                    print(f"🔄 Correct solution but NOT first attempt - no progress tracking")
                elif user and profile and result.get("valid", False) and gave_up:
                    print(f"🏳️ Correct solution but user gave up first - no progress tracking")
                
                return jsonify(result)
            except Exception as e:
                print(f"❌ Error in mode check: {str(e)}")
                import traceback
                traceback.print_exc()
                return jsonify({"error": f"Failed to check solution: {str(e)}"}), 500
        
        # For ranked mode, validate solution using Z3 directly
        try:
            # Get people list from statement_data (more reliable than guess for abandonment)
            people = list(statement_data.keys()) if statement_data else list(guess.keys())
            print(f"👥 People from statement_data: {list(statement_data.keys()) if statement_data else 'None'}")
            print(f"👥 People from guess: {list(guess.keys())}")
            print(f"👥 Final people list: {people}")
            
            if not people:
                print(f"❌ No people found - cannot process puzzle")
                return jsonify({"error": "No people data found in puzzle"}), 400
            
            z3_vars = {p: Bool(p) for p in people}
            solver = Solver()
            
            # Skip validation if abandoned or gave up - we want to apply penalty regardless
            if abandoned:
                print(f"🚪 Skipping validation for abandoned puzzle - applying full penalty")
                is_valid = False
            elif gave_up:
                print(f"🏳️ Skipping validation for gave up puzzle - applying penalty")
                is_valid = False
            else:
                # Build constraints from statement_data
                print(f"🔍 DEBUG: Building constraints from statement_data: {statement_data}")
                for speaker, st in statement_data.items():
                    print(f"🔍 DEBUG: Processing statement for {speaker}: {st}")
                    mode_type = st.get("mode") if isinstance(st, dict) else None
                    
                    if mode_type == "DIRECT":
                        target = st["target"]
                        # Handle both formats: 'claim' (ranked) and 'truth_value' (practice)
                        claim = st.get("claim", st.get("truth_value"))
                        if claim is None:
                            print(f"❌ Missing claim/truth_value for DIRECT statement by {speaker}")
                            return jsonify({"error": f"Missing claim/truth_value for DIRECT statement by {speaker}"}), 400
                        print(f"✅ Adding DIRECT constraint: {speaker} -> {target} == {claim}")
                        solver.add(Implies(z3_vars[speaker], z3_vars[target] == claim))
                        solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != claim))
                        
                    elif mode_type == "AND":
                        t1, t2 = st["t1"], st["t2"]
                        c1, c2 = st["c1"], st["c2"]
                        print(f"✅ Adding AND constraint: {speaker} -> ({t1}=={c1} AND {t2}=={c2})")
                        solver.add(Implies(z3_vars[speaker], And(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                        solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[t1] != c1, z3_vars[t2] != c2)))
                        
                    elif mode_type == "OR":
                        t1, t2 = st["t1"], st["t2"]
                        c1, c2 = st["c1"], st["c2"]
                        print(f"✅ Adding OR constraint: {speaker} -> ({t1}=={c1} OR {t2}=={c2})")
                        solver.add(Implies(z3_vars[speaker], Or(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                        solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[t1] != c1, z3_vars[t2] != c2)))
                        
                    elif mode_type == "IF":
                        cond = st["cond"]
                        cond_val = st["cond_val"]
                        result = st["result"]
                        result_val = st["result_val"]
                        implication = Implies(z3_vars[cond] == cond_val, z3_vars[result] == result_val)
                        print(f"✅ Adding IF constraint: {speaker} -> (IF {cond}=={cond_val} THEN {result}=={result_val})")
                        solver.add(Implies(z3_vars[speaker], implication))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
                        
                    elif mode_type == "XOR":
                        t1, t2 = st["t1"], st["t2"]
                        c1, c2 = st["c1"], st["c2"]
                        print(f"✅ Adding XOR constraint: {speaker} -> ({t1}=={c1} XOR {t2}=={c2})")
                        solver.add(Implies(z3_vars[speaker], Xor(z3_vars[t1] == c1, z3_vars[t2] == c2)))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(Xor(z3_vars[t1] == c1, z3_vars[t2] == c2))))
                        
                    elif mode_type == "IFF":
                        t1, t2 = st["t1"], st["t2"]
                        c1, c2 = st["c1"], st["c2"]
                        a1 = (z3_vars[t1] == c1)
                        a2 = (z3_vars[t2] == c2)
                        biconditional = And(Implies(a1, a2), Implies(a2, a1))
                        print(f"✅ Adding IFF constraint: {speaker} -> ({t1}=={c1} IFF {t2}=={c2})")
                        solver.add(Implies(z3_vars[speaker], biconditional))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(biconditional)))
                        
                    elif mode_type == "NESTED_IF":
                        inner_impl = Implies(z3_vars[st["inner_cond"]] == st["inner_val"], z3_vars[st["inner_result"]] == st["inner_result_val"])
                        nested_impl = Implies(z3_vars[st["outer_cond"]] == st["outer_val"], inner_impl)
                        print(f"✅ Adding NESTED_IF constraint: {speaker} -> nested implication")
                        solver.add(Implies(z3_vars[speaker], nested_impl))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(nested_impl)))
                        
                    elif mode_type == "GROUP":
                        cnt = Sum([If(z3_vars[m], 1, 0) for m in st["members"]])
                        print(f"✅ Adding GROUP constraint: {speaker} -> count({st['members']}) == {st['exactly']}")
                        solver.add(Implies(z3_vars[speaker], cnt == st["exactly"]))
                        solver.add(Implies(Not(z3_vars[speaker]), cnt != st["exactly"]))
                        
                    else:
                        # This is the critical fix - handle statements without 'mode' field
                        if isinstance(st, dict) and "target" in st:
                            # Simple statement format: {"target": "G", "truth_value": False}
                            target = st["target"]
                            truth_value = st.get("truth_value", st.get("claim"))
                            if truth_value is not None:
                                print(f"✅ Adding SIMPLE constraint: {speaker} -> {target} == {truth_value}")
                                solver.add(Implies(z3_vars[speaker], z3_vars[target] == truth_value))
                                solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != truth_value))
                            else:
                                print(f"❌ WARNING: Statement for {speaker} missing truth_value: {st}")
                        else:
                            print(f"❌ WARNING: Unrecognized statement format for {speaker}: {st}")
                            print(f"🚨 This statement will be IGNORED, which may cause incorrect validation!")
                
                # Add truth-teller count constraint
                print(f"🔢 Adding truth-teller count constraint: {num_truth_tellers} out of {len(people)}")
                solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
                
                # Add guess constraints (only if not abandoned)
                print(f"🎯 Adding user guess constraints: {guess}")
                for person, value in guess.items():
                    if person in z3_vars and value is not None:
                        print(f"  👤 {person} = {value}")
                        solver.add(z3_vars[person] == value)
                
                print(f"🧮 Solving puzzle with Z3...")
                is_valid = solver.check() == sat
                print(f"🎯 Z3 solver result: {'SAT (valid)' if is_valid else 'UNSAT (invalid)'}")
            
            # Handle Elo changes for ranked mode
            elo_change = None
            if is_ranked and user and profile and supabase:
                try:
                    print(f"💰 Processing ELO change for user {user['sub']}")
                    print(f"👤 User: {user}")
                    print(f"📊 Profile: {profile}")
                    
                    # Check if this is a placement match (user is unranked)
                    is_unranked = profile.get("elo") is None
                    placement_completed = profile.get("placement_matches_completed", 0)
                    
                    if is_unranked and placement_completed < PLACEMENT_MATCHES_REQUIRED:
                        print(f"🎯 PLACEMENT MATCH {placement_completed + 1}/{PLACEMENT_MATCHES_REQUIRED} for unranked user")
                        
                        # Get current hidden ELO
                        current_hidden_elo = profile.get("hidden_elo", DEFAULT_HIDDEN_ELO)
                        
                        # Determine actual mode for hidden ELO calculation
                        actual_mode = "Medium"  # Default for hidden ELO users
                        tier = get_tier(current_hidden_elo)
                        if tier:
                            # Find which mode this puzzle represents based on player count
                            for tier_mode, player_counts in tier["allowed_modes"].items():
                                if len(people) in player_counts:
                                    actual_mode = tier_mode
                                    break
                        
                        print(f"🎮 Determined puzzle mode: {actual_mode} with {len(people)} players")
                        print(f"📊 Current hidden ELO: {current_hidden_elo}")
                        
                        # Update hidden ELO based on performance
                        new_hidden_elo, hidden_elo_change, hidden_message = update_hidden_elo(
                            current_hidden_elo, actual_mode, len(people), time_taken, is_valid, gave_up, abandoned
                        )
                        
                        # Increment placement matches completed
                        new_placement_count = placement_completed + 1
                        
                        # Check if this completes placement matches
                        if new_placement_count >= PLACEMENT_MATCHES_REQUIRED:
                            # Final placement match - reveal hidden ELO as actual ELO
                            final_elo = reveal_placement_elo(new_hidden_elo)
                            print(f"🎉 PLACEMENT COMPLETE! Hidden ELO: {new_hidden_elo} → Revealed ELO: {final_elo}")
                            
                            update_data = {
                                "elo": final_elo,
                                "hidden_elo": None,  # Clear hidden ELO
                                "placement_matches_completed": new_placement_count,
                                "is_ranked": True
                            }
                            message = f"🎓 Placement Complete! Your ELO is {final_elo}! | {hidden_message}"
                            
                            # For display purposes
                            old_elo = None  # Don't show old ELO during placement
                            new_elo = final_elo
                            actual_change = final_elo  # Full revealed ELO
                        else:
                            # Still in placement matches
                            update_data = {
                                "hidden_elo": new_hidden_elo,
                                "placement_matches_completed": new_placement_count
                            }
                            message = f"Placement {new_placement_count}/5: {hidden_message}"
                            
                            # For display purposes (don't show actual values during placement)
                            old_elo = None  
                            new_elo = None
                            actual_change = hidden_elo_change
                        
                    else:
                        # Normal ranked match for ranked users
                        old_elo = profile["elo"]
                        print(f"📊 Current ELO: {old_elo}")
                        
                        # Determine actual mode for Elo calculation
                        actual_mode = "Easy"  # Default
                        tier = get_tier(old_elo)
                        if tier:
                            # Find which mode this puzzle represents based on player count
                            for tier_mode, player_counts in tier["allowed_modes"].items():
                                if len(people) in player_counts:
                                    actual_mode = tier_mode
                                    break
                        
                        print(f"🎮 Determined puzzle mode: {actual_mode} with {len(people)} players")
                        
                        gain_loss, message = compute_elo_change(
                            old_elo, actual_mode, len(people), time_taken, is_valid, gave_up, abandoned
                        )
                        new_elo = max(0, old_elo + gain_loss)
                        actual_change = gain_loss
                        
                        update_data = {"elo": new_elo}
                    
                    print(f"📈 ELO calculation: {old_elo} + {actual_change} = {new_elo}")
                    
                    # Update user's profile in database
                    print(f"💾 Updating profile in database...")
                    elo_update_result = supabase.table("profiles").update(update_data).eq("user_id", user["sub"]).execute()
                    print(f"✅ Profile update result: {elo_update_result}")
                    
                    # Record match in matches table
                    is_placement = is_unranked and placement_completed < PLACEMENT_MATCHES_REQUIRED
                    match_data = {
                        "user_id": user["sub"],
                        "mode": "Placement" if is_placement else actual_mode,
                        "num_players": len(people),
                        "solved": is_valid,
                        "time_taken": int(round(time_taken)),
                        "elo_before": old_elo,  # Will be None for placement matches
                        "elo_after": new_elo,   # Will be None for incomplete placement matches
                        "elo_delta": actual_change,
                        "is_placement_match": is_placement
                    }
                    
                    print(f"📝 Inserting match record: {match_data}")
                    match_insert_result = supabase.table("matches").insert(match_data).execute()
                    print(f"✅ Match insert result: {match_insert_result}")
                    
                    # Customize message for abandonment and giving up
                    if abandoned:
                        message = f"🚪 Abandoned puzzle — {message.split('—')[1].strip() if '—' in message else f'−{abs(actual_change)} ELO'}"
                    elif gave_up:
                        message = f"🏳️ Gave up — {message.split('—')[1].strip() if '—' in message else f'−{abs(actual_change)} ELO'}"
                    
                    elo_change = {
                        "old_elo": old_elo,
                        "new_elo": new_elo,
                        "change": actual_change,
                        "message": message,
                        "is_placement": is_placement,
                        "placement_number": placement_completed + 1 if is_placement else None
                    }
                    
                    print(f"🎉 ELO change successful: {elo_change}")
                    
                except Exception as e:
                    print(f"❌ Error updating Elo: {e}")
                    print(f"🔥 FULL ERROR DETAILS:")
                    import traceback
                    traceback.print_exc()
                    print(f"🔥 END ERROR DETAILS")
            elif is_ranked and user and not supabase:
                print("⚠️  Ranked mode Elo updates disabled: Supabase not configured")
            elif is_ranked and not user:
                print("⚠️  No user found for ranked mode ELO update")
            elif not is_ranked:
                print("ℹ️  Non-ranked mode - no ELO update needed")
            else:
                print(f"🚨 ELO UPDATE SKIPPED - is_ranked: {is_ranked}, user: {user is not None}, profile: {profile is not None}, supabase: {supabase is not None}")
            
            return jsonify({"valid": is_valid, "elo_change": elo_change})
        
        except Exception as e:
            print(f"❌ Error in ranked mode validation: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Failed to validate solution: {str(e)}"}), 500
        
    except Exception as e:
        print(f"❌ Unexpected error in /puzzle/check: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/puzzle/solution", methods=["POST"])
def get_puzzle_solution():
    """Get the solution for a practice mode puzzle."""
    data = request.json or {}
    print(f"🔍 /puzzle/solution received data: {data}")
    
    mode = data.get("mode")
    statement_data = data.get("statement_data", {})
    num_truth_tellers = data.get("num_truth_tellers")
    full_statement_data = data.get("full_statement_data", {})
    
    print(f"🎯 Mode: {mode}, Statement data keys: {list(statement_data.keys())}, Full statement data keys: {list(full_statement_data.keys())}")
    
    if not mode:
        return jsonify({"error": "Mode is required"}), 400
    if not statement_data and not full_statement_data:
        return jsonify({"error": "Statement data is required"}), 400
    if num_truth_tellers is None:
        return jsonify({"error": "Number of truth tellers is required"}), 400
    
    try:
        # Use the statement data to solve the puzzle with Z3
        statements = full_statement_data if full_statement_data else statement_data
        print(f"📊 Using statements: {statements}")
        
        people = list(statements.keys())
        print(f"👥 People: {people}")
        
        z3_vars = {p: Bool(p) for p in people}
        solver = Solver()
        
        # Add constraints based on mode
        if mode.lower() == "easy":
            print(f"🟢 Processing easy mode")
            for speaker, sdata in statements.items():
                print(f"  👤 {speaker}: {sdata}")
                if isinstance(sdata, dict) and "target" in sdata:
                    target = sdata["target"]
                    said_truth = sdata.get("truth_value", sdata.get("claim"))
                    print(f"    ➡️ {speaker} says {target} is {said_truth}")
                    solver.add(Implies(z3_vars[speaker], z3_vars[target] == said_truth))
                    solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != said_truth))
        
        elif mode.lower() in ["medium", "hard", "extreme", "ranked"]:
            print(f"🔵 Processing {mode} mode")
            for speaker, d in statements.items():
                print(f"  👤 {speaker}: {d}")
                if isinstance(d, dict) and "mode" in d:
                    print(f"    🔧 Complex statement with mode: {d['mode']}")
                    # Full statement data format
                    if d["mode"] == "DIRECT":
                        # Handle both formats: 'claim' (ranked) and 'truth_value' (practice)
                        claim = d.get("claim", d.get("truth_value"))
                        solver.add(Implies(z3_vars[speaker], z3_vars[d["target"]] == claim))
                        solver.add(Implies(Not(z3_vars[speaker]), z3_vars[d["target"]] != claim))
                        
                    elif d["mode"] == "AND":
                        solver.add(Implies(z3_vars[speaker], And(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                        solver.add(Implies(Not(z3_vars[speaker]), Or(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))
                        
                    elif d["mode"] == "OR":
                        solver.add(Implies(z3_vars[speaker], Or(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                        solver.add(Implies(Not(z3_vars[speaker]), And(z3_vars[d["t1"]] != d["c1"], z3_vars[d["t2"]] != d["c2"])))
                        
                    elif d["mode"] == "IF":
                        implication = Implies(z3_vars[d["cond"]] == d["cond_val"], z3_vars[d["result"]] == d["result_val"])
                        solver.add(Implies(z3_vars[speaker], implication))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(implication)))
                        
                    elif d["mode"] == "XOR":
                        solver.add(Implies(z3_vars[speaker], Xor(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"])))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(Xor(z3_vars[d["t1"]] == d["c1"], z3_vars[d["t2"]] == d["c2"]))))
                        
                    elif d["mode"] == "IFF":
                        a1 = (z3_vars[d["t1"]] == d["c1"])
                        a2 = (z3_vars[d["t2"]] == d["c2"])
                        biconditional = And(Implies(a1, a2), Implies(a2, a1))
                        solver.add(Implies(z3_vars[speaker], biconditional))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(biconditional)))
                        
                    elif d["mode"] == "NESTED_IF":
                        inner_impl = Implies(z3_vars[d["inner_cond"]] == d["inner_val"], z3_vars[d["inner_result"]] == d["inner_result_val"])
                        nested_impl = Implies(z3_vars[d["outer_cond"]] == d["outer_val"], inner_impl)
                        solver.add(Implies(z3_vars[speaker], nested_impl))
                        solver.add(Implies(Not(z3_vars[speaker]), Not(nested_impl)))
                        
                    elif d["mode"] == "GROUP":
                        cnt = Sum([If(z3_vars[m], 1, 0) for m in d["members"]])
                        solver.add(Implies(z3_vars[speaker], cnt == d["exactly"]))
                        solver.add(Implies(Not(z3_vars[speaker]), cnt != d["exactly"]))
                else:
                    # Simple statement data format (fallback)
                    print(f"    🔄 Using fallback for simple statement data")
                    target = d.get("target")
                    truth_value = d.get("truth_value")
                    print(f"    📝 Target: {target}, Truth value: {truth_value}")
                    if target and truth_value is not None:
                        print(f"    ✅ Adding constraint: {speaker} -> {target} == {truth_value}")
                        solver.add(Implies(z3_vars[speaker], z3_vars[target] == truth_value))
                        solver.add(Implies(Not(z3_vars[speaker]), z3_vars[target] != truth_value))
                    else:
                        print(f"    ❌ Invalid statement data: missing target or truth_value")
        
        # Add truth-teller count constraint
        solver.add(Sum([If(z3_vars[p], 1, 0) for p in people]) == num_truth_tellers)
        print(f"🔢 Added truth-teller constraint: {num_truth_tellers} out of {len(people)}")
        
        # Solve the puzzle
        print(f"🧮 Solving puzzle...")
        if solver.check() == sat:
            model = solver.model()
            solution = {p: bool(model[z3_vars[p]]) for p in people}
            print(f"✅ Solution found: {solution}")
            return jsonify({"solution": solution})
        else:
            print(f"❌ No solution found")
            return jsonify({"error": "No solution found for this puzzle"}), 400
            
    except Exception as e:
        print(f"❌ Exception in solution endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to solve puzzle: {str(e)}"}), 500

@app.route("/user/elo", methods=["GET"])
@auth_required
def get_user_elo(user, profile):
    """Get user's current Elo, tier, and match history."""
    if not supabase:
        return jsonify({"error": "Elo tracking not available: Supabase not configured"}), 503
        
    try:
        user_id = user["sub"]
        print(f"🔍 DEBUG: Fetching matches for user {user_id}")
        
        # Check if user is in placement matches
        is_placement = is_placement_match(profile)
        placement_completed = profile.get("placement_matches_completed", 0)
        
        # Fetch recent matches
        matches_resp = supabase.table("matches") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        
        recent_matches = matches_resp.data or []
        print(f"📊 DEBUG: Found {len(recent_matches)} matches")
        
        if recent_matches:
            # Log first few matches to see their dates
            for i, match in enumerate(recent_matches[:3]):
                print(f"  Match {i+1}: created_at={match.get('created_at')}, solved={match.get('solved')}")
        
        # Handle unranked users (in placement matches)
        if is_placement:
            response_data = {
                "elo": None,  # Don't show ELO during placement
                "tier": "Unranked",
                "placement_matches_completed": placement_completed,
                "placement_matches_required": PLACEMENT_MATCHES_REQUIRED,
                "is_in_placement": True,
                "matches": recent_matches
            }
        else:
            # Handle ranked users
            elo = profile["elo"]
            tier_info = get_tier(elo)
            tier_label = tier_info["label"] if tier_info else "Unknown"
            
            response_data = {
                "elo": elo,
                "tier": tier_label,
                "placement_matches_completed": placement_completed,
                "placement_matches_required": PLACEMENT_MATCHES_REQUIRED,
                "is_in_placement": False,
                "matches": recent_matches
            }
        
        print(f"✅ DEBUG: Returning {len(recent_matches)} matches to frontend")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"❌ Error in /user/elo: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/user/username", methods=["PATCH"])
@auth_required
def update_username(user, profile):
    """Allow a signed-in user to change their username."""
    if not supabase:
        return jsonify({"error": "Username updates not available: Supabase not configured"}), 503
        
    data = request.json or {}
    new_username = data.get('username', '').strip()

    # Basic server-side validation
    if not new_username:
        return jsonify({"error": "Username cannot be empty"}), 400
    if len(new_username) < 3 or len(new_username) > 20:
        return jsonify({"error": "Username must be 3–20 characters"}), 400
    if not all(c.isalnum() or c == '_' for c in new_username):
        return jsonify({"error": "Username may only contain letters, numbers, and underscores"}), 400

    try:
        # Check uniqueness in profiles table
        existing_resp = supabase.table('profiles') \
            .select("user_id") \
            .eq('username', new_username) \
            .limit(1) \
            .execute()
        
        if existing_resp.data and len(existing_resp.data) > 0:
            existing_user_id = existing_resp.data[0]["user_id"]
            if existing_user_id != user['sub']:
                return jsonify({"error": "That username is already taken"}), 409

        # Perform update in Supabase
        update_resp = supabase.table('profiles') \
            .update({"username": new_username}) \
            .eq('user_id', user['sub']) \
            .execute()

        if hasattr(update_resp, 'error') and update_resp.error:
            return jsonify({"error": update_resp.error.message}), 500

        return jsonify({"success": True, "username": new_username}), 200

    except Exception as e:
        print(f"Error updating username: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route("/me")
@auth_required  
def get_user_profile(user, profile):
    """Get current user's profile information including username."""
    if not supabase:
        return jsonify({"error": "Profile not available: Supabase not configured"}), 503
        
    try:
        # Get username from profile, fallback to email prefix if not set
        username = profile.get("username")
        if not username:
            username = user["email"].split('@')[0] if user.get("email") else "User"
            
        return jsonify({
            "user": {
                "id": user["sub"],
                "email": user["email"], 
                "username": username,
                "elo": profile["elo"]
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/leaderboard", methods=["GET"])
@auth_optional
def get_leaderboard(user=None, profile=None):
    """
    Public route returning top-500 RANKED users by ELO (desc). 
    Ties share the same rank. Include username and tier.
    Unranked users (elo = NULL) are excluded.
    """
    if not supabase:
        return jsonify({"error": "Leaderboard not available: Supabase not configured"}), 503
        
    try:
        # 1. Fetch top 500 RANKED users from Supabase "profiles" table
        # Filter out unranked users (elo IS NULL or is_ranked = false)
        resp = supabase.table('profiles') \
            .select('user_id, username, elo') \
            .eq('is_ranked', True) \
            .order('elo', desc=True) \
            .limit(500) \
            .execute()

        if hasattr(resp, 'error') and resp.error:
            return jsonify({"error": resp.error.message}), 500

        rows = resp.data or []  # list of { user_id, username, elo }
        print(f"📊 Leaderboard: Found {len(rows)} ranked users")

        # 2. Build a list with proper "competition ranking"
        leaderboard = []
        previous_elo = None
        previous_rank = 0
        count_processed = 0

        # Define tier mappings (matching elo_system.py)
        def compute_tier_label(e):
            # Add safety check for None values (shouldn't happen after filtering, but just in case)
            if e is None:
                return "Unranked"
            if e >= 2000:         return "Grandmaster Thinker"
            elif e >= 1500:       return "Critical Thinker"
            elif e >= 1000:       return "Advanced Thinker"
            elif e >= 500:        return "Intermediate Thinker"
            else:                 return "Beginner Thinker"

        for row in rows:
            count_processed += 1
            current_elo = row['elo']
            username = row['username'] or row['user_id']  # Fallback if no username
            
            # Skip any rows with NULL elo (extra safety check)
            if current_elo is None:
                print(f"⚠️ Skipping user {row['user_id']} with NULL elo")
                count_processed -= 1  # Don't count this in ranking
                continue

            # Assign rank: if same as previous ELO, same rank; else rank = count_processed
            if previous_elo is None or current_elo < previous_elo:
                rank = count_processed
                previous_rank = rank
            else:
                rank = previous_rank

            previous_elo = current_elo

            leaderboard.append({
                "rank":       rank,
                "user_id":    row['user_id'],
                "username":   username,
                "elo":        current_elo,
                "tier":       compute_tier_label(current_elo)
            })

        print(f"✅ Leaderboard: Returning {len(leaderboard)} ranked users")
        return jsonify({"leaderboard": leaderboard}), 200

    except Exception as e:
        print(f"❌ Error in /leaderboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Server error"}), 500

@app.route("/test/abandon", methods=["POST"])
def test_abandon():
    """Test endpoint to verify abandonment processing works."""
    try:
        data = request.json or {}
        print(f"🧪 TEST ABANDON: {data}")
        
        abandoned = data.get("abandoned", False)
        if abandoned:
            print(f"✅ TEST: Abandonment flag detected successfully!")
            return jsonify({"status": "success", "message": "Abandonment test passed", "abandoned": True})
        else:
            return jsonify({"status": "no_abandon", "message": "No abandonment flag found"})
            
    except Exception as e:
        print(f"❌ TEST ERROR: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/test/create-sample-matches", methods=["POST"])
@auth_required
def create_sample_matches(user, profile):
    """Create sample matches for testing match history functionality."""
    if not supabase:
        return jsonify({"error": "Database not available: Supabase not configured"}), 503
        
    try:
        user_id = user["sub"]
        print(f"🧪 Creating sample matches for user {user_id}")
        
        # Create sample matches
        sample_matches = []
        base_time = datetime.datetime.now()
        
        # Create 15 sample matches spanning the last few days
        for i in range(15):
            match_time = base_time - datetime.timedelta(hours=i*2)
            is_win = i % 3 != 0  # Win 2/3 of the time
            
            if i < 5:
                # Recent matches
                mode = "Easy"
                players = 4
                time_taken = 45 + (i * 10)
                elo_before = profile["elo"] + (i * 20)
            elif i < 10:
                # Medium difficulty matches
                mode = "Medium" 
                players = 5
                time_taken = 60 + (i * 8)
                elo_before = profile["elo"] + 100 + ((i-5) * 15)
            else:
                # Hard matches
                mode = "Hard"
                players = 6
                time_taken = 90 + (i * 5)
                elo_before = profile["elo"] + 200 + ((i-10) * 10)
            
            elo_change = 25 if is_win else -15
            if i == 2:  # Make one match an abandonment
                is_win = False
                elo_change = -30
            elif i == 7:  # Make one match a give up
                is_win = False
                elo_change = -20
            
            match_data = {
                "user_id": user_id,
                "mode": mode,
                "num_players": players,
                "solved": is_win,
                "time_taken": time_taken,
                "elo_before": elo_before,
                "elo_after": elo_before + elo_change,
                "elo_delta": elo_change,
                "created_at": match_time.isoformat()
            }
                
            sample_matches.append(match_data)
        
        # Insert matches
        result = supabase.table("matches").insert(sample_matches).execute()
        
        print(f"✅ Successfully inserted {len(result.data)} sample matches")
        
        return jsonify({
            "success": True,
            "matches_created": len(result.data),
            "message": "Sample matches created successfully! Refresh your match history to see them."
        }), 200
        
    except Exception as e:
        print(f"❌ Error creating sample matches: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({"status": "MindRank backend is running!"})

@app.route("/user/matches", methods=["GET"])
@auth_required
def get_user_matches(user, profile):
    """Get user's match history with optional limit and order parameters."""
    if not supabase:
        return jsonify({"error": "Match history not available: Supabase not configured"}), 503
        
    try:
        user_id = user["sub"]
        
        # Get query parameters
        limit = request.args.get('limit', '10', type=int)
        order = request.args.get('order', 'desc').lower()
        
        # Validate parameters
        if limit < 1 or limit > 100:
            limit = 10
        if order not in ['asc', 'desc']:
            order = 'desc'
            
        print(f"🔍 DEBUG: Fetching {limit} matches for user {user_id} in {order} order")
        
        # First, let's get ALL matches to see what's in the database
        all_matches_query = supabase.table("matches") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True)
        
        all_matches_resp = all_matches_query.execute()
        all_matches = all_matches_resp.data or []
        
        print(f"📊 DEBUG: Found {len(all_matches)} total matches in database")
        
        # Log all matches with their timestamps
        for i, match in enumerate(all_matches):
            print(f"  All Match {i+1}: created_at={match.get('created_at')}, solved={match.get('solved')}, mode={match.get('mode')}")
        
        # Now get the limited matches
        query = supabase.table("matches") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=(order == 'desc')) \
            .limit(limit)
        
        matches_resp = query.execute()
        matches = matches_resp.data or []
        
        print(f"📊 DEBUG: Returning {len(matches)} limited matches")
        
        if matches:
            # Log the limited matches to see their dates
            for i, match in enumerate(matches):
                print(f"  Limited Match {i+1}: created_at={match.get('created_at')}, solved={match.get('solved')}, mode={match.get('mode')}")
        
        return jsonify({"matches": matches}), 200
        
    except Exception as e:
        print(f"❌ Error in /user/matches: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/user/practice-progress", methods=["GET"])
@auth_required
def get_practice_progress(user, profile):
    """Get user's practice mode progress for displaying progress bars."""
    if not supabase:
        return jsonify({"error": "Practice progress not available: Supabase not configured"}), 503
        
    try:
        # Get current progress for each mode
        easy_solved = profile.get("easy_puzzles_solved", 0)
        medium_solved = profile.get("medium_puzzles_solved", 0)
        hard_solved = profile.get("hard_puzzles_solved", 0)
        extreme_solved = profile.get("extreme_puzzles_solved", 0)
        
        progress_data = {
            "easy": {
                "solved": easy_solved,
                "total": 10,
                "unlocked": True,  # Easy is always unlocked
                "completed": easy_solved >= 10
            },
            "medium": {
                "solved": medium_solved,
                "total": 10,
                "unlocked": easy_solved >= 10,  # Unlocked after completing easy
                "completed": medium_solved >= 10
            },
            "hard": {
                "solved": hard_solved,
                "total": 10,
                "unlocked": medium_solved >= 10,  # Unlocked after completing medium
                "completed": hard_solved >= 10
            },
            "extreme": {
                "solved": extreme_solved,
                "total": 10,
                "unlocked": hard_solved >= 10 and EXTREME_MODE_AVAILABLE,  # Unlocked after completing hard
                "completed": extreme_solved >= 10
            }
        }
        
        # Calculate percentages for unlocked modes
        for mode_data in progress_data.values():
            if mode_data["unlocked"]:
                mode_data["percentage"] = (mode_data["solved"] / mode_data["total"]) * 100
            else:
                mode_data["percentage"] = 0  # Don't show progress for locked modes
        
        return jsonify({"practice_progress": progress_data}), 200
        
    except Exception as e:
        print(f"❌ Error in /user/practice-progress: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/practice/progress-bars", methods=["GET"])
@auth_optional
def get_practice_progress_bars(user=None, profile=None):
    """Get practice mode progress bar data optimized for UI display."""
    
    # If user is not authenticated, return no progress bars
    if not user or not profile or not supabase:
        return jsonify({"progress_bars": []}), 200
        
    try:
        # Get current progress for each mode
        easy_solved = profile.get("easy_puzzles_solved", 0)
        medium_solved = profile.get("medium_puzzles_solved", 0)
        hard_solved = profile.get("hard_puzzles_solved", 0)
        extreme_solved = profile.get("extreme_puzzles_solved", 0)
        
        progress_bars = []
        
        # Easy mode - always show progress bar (always unlocked)
        progress_bars.append({
            "mode": "easy",
            "title": "Easy Mode",
            "description": "Direct truth/lie statements. Perfect for beginners to learn the basics.",
            "show_progress_bar": True,
            "solved": easy_solved,
            "total": 10,
            "percentage": min((easy_solved / 10) * 100, 100),
            "completed": easy_solved >= 10,
            "progress_text": f"{easy_solved}/10"
        })
        
        # Medium mode - show progress bar only if unlocked
        medium_unlocked = easy_solved >= 10
        if medium_unlocked:
            progress_bars.append({
                "mode": "medium",
                "title": "Medium Mode", 
                "description": "AND/OR logic puzzles. Build your logical reasoning skills.",
                "show_progress_bar": True,
                "solved": medium_solved,
                "total": 10,
                "percentage": min((medium_solved / 10) * 100, 100),
                "completed": medium_solved >= 10,
                "progress_text": f"{medium_solved}/10"
            })
        
        # Hard mode - show progress bar only if unlocked
        hard_unlocked = medium_solved >= 10
        if hard_unlocked:
            progress_bars.append({
                "mode": "hard",
                "title": "Hard Mode",
                "description": "Complex conditionals and nested logic. For advanced thinkers.",
                "show_progress_bar": True,
                "solved": hard_solved,
                "total": 10,
                "percentage": min((hard_solved / 10) * 100, 100),
                "completed": hard_solved >= 10,
                "progress_text": f"{hard_solved}/10"
            })
        
        # Extreme mode - show progress bar only if unlocked and available
        extreme_unlocked = hard_solved >= 10 and EXTREME_MODE_AVAILABLE
        if extreme_unlocked:
            progress_bars.append({
                "mode": "extreme",
                "title": "Extreme Mode",
                "description": "Multi-layered logic puzzles. The ultimate challenge.",
                "show_progress_bar": True,
                "solved": extreme_solved,
                "total": 10,
                "percentage": min((extreme_solved / 10) * 100, 100),
                "completed": extreme_solved >= 10,
                "progress_text": f"{extreme_solved}/10"
            })
        
        return jsonify({"progress_bars": progress_bars}), 200
        
    except Exception as e:
        print(f"❌ Error in /practice/progress-bars: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/master/progress-bars", methods=["GET"])
@auth_optional
def get_master_progress_bars(user=None, profile=None):
    """Get master mode progress bar data optimized for UI display."""
    
    # If user is not authenticated, return no progress bars
    if not user or not profile or not supabase:
        return jsonify({"progress_bars": []}), 200
        
    try:
        # Get current progress for each master mode
        easy_solved = profile.get("master_easy_puzzles_solved", 0)
        medium_solved = profile.get("master_medium_puzzles_solved", 0)
        hard_solved = profile.get("master_hard_puzzles_solved", 0)
        extreme_solved = profile.get("master_extreme_puzzles_solved", 0)
        
        progress_bars = []
        
        # Easy mode - always show progress bar (always unlocked)
        progress_bars.append({
            "mode": "easy",
            "title": "Master Easy",
            "description": "No takebacks! Permanent selections test your deductive reasoning.",
            "show_progress_bar": True,
            "solved": easy_solved,
            "total": 10,
            "percentage": min((easy_solved / 10) * 100, 100),
            "completed": easy_solved >= 10,
            "progress_text": f"{easy_solved}/10"
        })
        
        # Medium mode - show progress bar only if unlocked
        medium_unlocked = easy_solved >= 10
        if medium_unlocked:
            progress_bars.append({
                "mode": "medium",
                "title": "Master Medium", 
                "description": "AND/OR puzzles with locked choices. Pure logical thinking required.",
                "show_progress_bar": True,
                "solved": medium_solved,
                "total": 10,
                "percentage": min((medium_solved / 10) * 100, 100),
                "completed": medium_solved >= 10,
                "progress_text": f"{medium_solved}/10"
            })
        
        # Hard mode - show progress bar only if unlocked
        hard_unlocked = medium_solved >= 10
        if hard_unlocked:
            progress_bars.append({
                "mode": "hard",
                "title": "Master Hard",
                "description": "IF/THEN conditionals with permanent choices. Working memory mastery.",
                "show_progress_bar": True,
                "solved": hard_solved,
                "total": 10,
                "percentage": min((hard_solved / 10) * 100, 100),
                "completed": hard_solved >= 10,
                "progress_text": f"{hard_solved}/10"
            })
        
        # Extreme mode - show progress bar only if unlocked and available
        extreme_unlocked = hard_solved >= 10 and EXTREME_MODE_AVAILABLE
        if extreme_unlocked:
            progress_bars.append({
                "mode": "extreme",
                "title": "Master Extreme",
                "description": "Ultimate challenge: advanced logic with no safety net.",
                "show_progress_bar": True,
                "solved": extreme_solved,
                "total": 10,
                "percentage": min((extreme_solved / 10) * 100, 100),
                "completed": extreme_solved >= 10,
                "progress_text": f"{extreme_solved}/10"
            })
        
        return jsonify({"progress_bars": progress_bars}), 200
        
    except Exception as e:
        print(f"❌ Error in /master/progress-bars: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)