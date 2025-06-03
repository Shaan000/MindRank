from math import floor

# New tier system with time limits and difficulty multipliers
ELO_TIERS = [
    {
        "min": 0,
        "max": 499,
        "label": "Beginner Thinker",
        "allowed_modes": {"Easy": list(range(3, 5))},  # 3-4 players max
        "time_limits": {"Easy": 60},
        "difficulty_mult": {"Easy": 1.0}
    },
    {
        "min": 500,
        "max": 999,
        "label": "Intermediate Thinker",
        "allowed_modes": {
            "Easy": list(range(4, 6)),    # 4-5 players
            "Medium": list(range(4, 6))   # 4-5 players
        },
        "time_limits": {"Easy": 40, "Medium": 120},
        "difficulty_mult": {"Easy": 1.0, "Medium": 1.3}
    },
    {
        "min": 1000,
        "max": 1499,
        "label": "Advanced Thinker",
        "allowed_modes": {
            "Medium": list(range(5, 7)),  # 5-6 players
            "Hard": list(range(4, 6))     # 4-5 players
        },
        "time_limits": {"Medium": 100, "Hard": 180},
        "difficulty_mult": {"Medium": 1.3, "Hard": 1.6}
    },
    {
        "min": 1500,
        "max": 1999,
        "label": "Critical Thinker",
        "allowed_modes": {"Hard": list(range(5, 8))},  # 5-7 players
        "time_limits": {"Hard": 180},
        "difficulty_mult": {"Hard": 1.6}
    },
    {
        "min": 2000,
        "max": float('inf'),
        "label": "Grandmaster Thinker",
        "allowed_modes": {
            "Hard": list(range(6, 9)),     # 6-8 players
            "Extreme": list(range(6, 9))   # 6-8 players max (not 12-16!)
        },
        "time_limits": {"Hard": 240, "Extreme": 300},
        "difficulty_mult": {"Hard": 1.6, "Extreme": 2.0}
    }
]

# Placement match system configuration
PLACEMENT_MATCHES_REQUIRED = 5
PLACEMENT_STARTING_ELO = 1000  # Starting point for placement calculations

# Default hidden ELO for new unranked users (intermediate level)
DEFAULT_HIDDEN_ELO = 750  # "Intermediate Thinker" tier for starting with medium puzzles

# Dynamic time limits - base time for 5 players, scaled by player count
BASE_TIME_LIMITS = {
    "Easy": 45,      # Simple direct statements
    "Medium": 75,    # AND/OR logic
    "Hard": 120,     # Complex conditionals and nested logic
    "Extreme": 180   # Very complex multi-layered logic
}

# Time scaling constants
BASE_PLAYER_COUNT = 5  # Reference point for base times
TIME_PER_EXTRA_PLAYER = 15  # Seconds added per player above base
TIME_PER_MISSING_PLAYER = 10  # Seconds removed per player below base

# Placement match K-factors (much higher than normal ranked)
PLACEMENT_K_FACTORS = {
    "win": 150,        # 5x higher than normal max win (30)
    "loss_full": 200,  # ~4.5x higher than normal max loss (45)
    "loss_partial": 100  # ~3x higher than normal max partial loss (30)
}

# K-factors for wins by tier
K_WIN = {
    "Beginner Thinker": 36,
    "Intermediate Thinker": 30,
    "Advanced Thinker": 24,
    "Critical Thinker": 18,
    "Grandmaster Thinker": 12
}

# K-factors for full losses by tier
K_LOSS_FULL = {
    "Beginner Thinker": 18,
    "Intermediate Thinker": 24,
    "Advanced Thinker": 30,
    "Critical Thinker": 36,
    "Grandmaster Thinker": 45
}

# K-factors for partial losses by tier
K_LOSS_PARTIAL = {
    "Beginner Thinker": 9,
    "Intermediate Thinker": 15,
    "Advanced Thinker": 21,
    "Critical Thinker": 27,
    "Grandmaster Thinker": 30
}

def get_tier(elo):
    """Get the tier information for a given Elo rating."""
    for tier in ELO_TIERS:
        if tier["min"] <= elo <= tier["max"]:
            return tier
    return None

def get_valid_modes_for_tier(elo):
    """Get all valid modes and player counts for a given Elo rating."""
    tier = get_tier(elo)
    if not tier:
        return {}
    return tier["allowed_modes"]

def compute_elo_change(player_elo, mode, num_players, time_taken_sec, solved, gave_up=False, abandoned=False):
    """
    Compute Elo change based on the three-zone time penalty system.
    
    Args:
        player_elo: Current player Elo rating
        mode: Puzzle mode ("Easy", "Medium", "Hard", "Extreme")
        num_players: Number of players in the puzzle
        time_taken_sec: Time taken to solve/give up in seconds
        solved: Boolean - whether the puzzle was solved correctly
        gave_up: Boolean - whether the player gave up
        abandoned: Boolean - whether the player abandoned (gets full penalty)
    
    Returns:
        tuple: (elo_change, message)
    """
    tier = get_tier(player_elo)
    if not tier:
        return 0, "❌ Could not determine your tier."

    label = tier["label"]
    allowed = tier["allowed_modes"].get(mode, [])
    if num_players not in allowed:
        return 0, (
            f"📉 No ELO change — {mode} with {num_players} players "
            f"is not valid for tier '{label}'."
        )

    T_max = tier["time_limits"].get(mode, float("inf"))
    diff_mult = tier["difficulty_mult"].get(mode, 1.0)
    K_full_win = K_WIN[label]
    K_full_loss = K_LOSS_FULL[label]
    K_part_loss = K_LOSS_PARTIAL[label]

    # 1) If solved:
    if solved:
        if time_taken_sec <= T_max:
            gain = int(K_full_win * diff_mult)
            return gain, f"✅ +{gain} ELO for solving a {mode} puzzle in {time_taken_sec:.0f}s!"
        elif time_taken_sec <= 2 * T_max:
            gain = int(floor(K_full_win * diff_mult * 0.5))
            return gain, (
                f"⚠️ +{gain} ELO for solving {mode} puzzle, but you were slow."
                f" ({time_taken_sec:.0f}s > {T_max}s)"
            )
        else:
            # Too slow → full loss penalty
            loss = K_full_loss
            return -loss, (
                f"⚠️ Too slow (>{2*T_max:.0f}s) for your tier ({label}). −{loss} ELO."
            )

    # 2) Not solved:
    if abandoned:
        # Full penalty for abandoning - most severe
        loss = K_full_loss
        return -loss, f"🚪 Abandoned puzzle — −{loss} ELO."
    elif gave_up:
        # Partial penalty for giving up after attempting
        loss = K_part_loss
        return -loss, f"🧹 You gave up — −{loss} ELO."
    else:
        # Incorrect guess - full penalty
        loss = K_full_loss
        return -loss, f"❌ Incorrect — −{loss} ELO."

def suggest_puzzle(elo):
    """Get all valid puzzle configurations for a given ELO rating."""
    # Handle None ELO (unranked users) by using default hidden ELO
    effective_elo = elo if elo is not None else DEFAULT_HIDDEN_ELO
    
    tier = get_tier(effective_elo)
    if not tier:
        return []
    
    # Get all valid mode/player combinations
    valid_combinations = []
    for mode, player_counts in tier["allowed_modes"].items():
        for num_players in player_counts:
            valid_combinations.append((mode, num_players))
    
    return valid_combinations

def get_random_puzzle_config(elo):
    """Get a random valid puzzle configuration for the user's tier."""
    import random
    
    # Handle None ELO (unranked users) by using default hidden ELO
    effective_elo = elo if elo is not None else DEFAULT_HIDDEN_ELO
    
    tier = get_tier(effective_elo)
    if not tier:
        return None, None
    
    # Get all valid mode/player combinations
    valid_combinations = []
    for mode, player_counts in tier["allowed_modes"].items():
        for num_players in player_counts:
            valid_combinations.append((mode, num_players))
    
    if not valid_combinations:
        return None, None
    
    return random.choice(valid_combinations)

def get_random_puzzle_config_for_unranked(hidden_elo=None):
    """Get a random puzzle configuration for unranked users based on their hidden ELO."""
    import random
    
    # Use provided hidden ELO or default to intermediate level
    effective_elo = hidden_elo if hidden_elo is not None else DEFAULT_HIDDEN_ELO
    
    tier = get_tier(effective_elo)
    if not tier:
        # Fallback to beginner tier if something goes wrong
        tier = ELO_TIERS[0]
    
    # Get all valid mode/player combinations for this tier
    valid_combinations = []
    for mode, player_counts in tier["allowed_modes"].items():
        for num_players in player_counts:
            valid_combinations.append((mode, num_players))
    
    if not valid_combinations:
        # Ultimate fallback - easy mode with 4 players
        return "Easy", 4
    
    return random.choice(valid_combinations)

def update_hidden_elo(current_hidden_elo, mode, num_players, time_taken_sec, solved, gave_up=False, abandoned=False):
    """
    Update hidden ELO for unranked users during placement matches.
    
    Args:
        current_hidden_elo: Current hidden ELO
        mode: Puzzle mode ("Easy", "Medium", "Hard", "Extreme")
        num_players: Number of players in the puzzle
        time_taken_sec: Time taken to solve/give up in seconds
        solved: Boolean - whether the puzzle was solved correctly
        gave_up: Boolean - whether the player gave up
        abandoned: Boolean - whether the player abandoned
    
    Returns:
        tuple: (new_hidden_elo, elo_change, message)
    """
    # Use placement match K-factors for larger ELO swings
    if solved:
        gain = PLACEMENT_K_FACTORS["win"]
        new_elo = current_hidden_elo + gain
        return new_elo, gain, f"🏆 Hidden ELO: +{gain} for solving! (Hidden ELO: {new_elo})"
    
    if abandoned:
        loss = PLACEMENT_K_FACTORS["loss_full"]
        new_elo = max(0, current_hidden_elo - loss)  # Don't go below 0
        return new_elo, -loss, f"🚪 Hidden ELO: Abandoned — -{loss} (Hidden ELO: {new_elo})"
    elif gave_up:
        loss = PLACEMENT_K_FACTORS["loss_partial"]
        new_elo = max(0, current_hidden_elo - loss)
        return new_elo, -loss, f"🧹 Hidden ELO: Gave up — -{loss} (Hidden ELO: {new_elo})"
    else:
        loss = PLACEMENT_K_FACTORS["loss_full"]
        new_elo = max(0, current_hidden_elo - loss)
        return new_elo, -loss, f"❌ Hidden ELO: Incorrect — -{loss} (Hidden ELO: {new_elo})"

def reveal_placement_elo(hidden_elo):
    """
    Convert hidden ELO to revealed ELO after 5 placement matches.
    
    Args:
        hidden_elo: Final hidden ELO after placement matches
    
    Returns:
        int: Revealed ELO (same as hidden ELO, but now public)
    """
    # Ensure ELO is within reasonable bounds
    revealed_elo = max(0, min(2500, hidden_elo))
    return revealed_elo

PLAYER_ELO_FILE = "elo_rating.txt"

def load_elo():
    try:
        with open(PLAYER_ELO_FILE, "r") as f:
            return int(f.read().strip())
    except:
        return 1000

def save_elo(new_elo):
    with open(PLAYER_ELO_FILE, "w") as f:
        f.write(str(new_elo))

def is_placement_match(profile):
    """Check if this should be a placement match."""
    if not profile:
        return False
    
    placement_completed = profile.get("placement_matches_completed", 0)
    is_ranked = profile.get("is_ranked", False)
    
    return not is_ranked and placement_completed < PLACEMENT_MATCHES_REQUIRED

def compute_placement_elo_change(current_match_number, solved, gave_up=False, abandoned=False):
    """
    Compute ELO change during placement matches.
    
    Args:
        current_match_number: Which placement match this is (1-5)
        solved: Boolean - whether the puzzle was solved correctly
        gave_up: Boolean - whether the player gave up
        abandoned: Boolean - whether the player abandoned
    
    Returns:
        tuple: (elo_change, message)
    """
    if solved:
        gain = PLACEMENT_K_FACTORS["win"]
        return gain, f"🏆 Placement Match {current_match_number}/5: +{gain} ELO for solving!"
    
    if abandoned:
        loss = PLACEMENT_K_FACTORS["loss_full"]
        return -loss, f"🚪 Placement Match {current_match_number}/5: Abandoned — -{loss} ELO"
    elif gave_up:
        loss = PLACEMENT_K_FACTORS["loss_partial"]
        return -loss, f"🧹 Placement Match {current_match_number}/5: Gave up — -{loss} ELO"
    else:
        loss = PLACEMENT_K_FACTORS["loss_full"]
        return -loss, f"❌ Placement Match {current_match_number}/5: Incorrect — -{loss} ELO"

def calculate_final_placement_elo(placement_results):
    """
    Calculate final ELO after all 5 placement matches.
    
    Args:
        placement_results: List of ELO changes from placement matches
    
    Returns:
        int: Final ELO rating
    """
    total_change = sum(placement_results)
    final_elo = PLACEMENT_STARTING_ELO + total_change
    
    # Ensure ELO doesn't go below 0 or above reasonable bounds
    final_elo = max(0, min(2500, final_elo))
    
    return final_elo

def calculate_dynamic_time_limit(mode, num_players):
    """
    Calculate dynamic time limit based on mode and number of players.
    
    Args:
        mode: Puzzle mode ("Easy", "Medium", "Hard", "Extreme")
        num_players: Number of players in the puzzle
    
    Returns:
        int: Time limit in seconds
    """
    base_time = BASE_TIME_LIMITS.get(mode, 60)  # Default 60s if mode not found
    
    if num_players > BASE_PLAYER_COUNT:
        # More players = more time
        extra_players = num_players - BASE_PLAYER_COUNT
        time_bonus = extra_players * TIME_PER_EXTRA_PLAYER
        return base_time + time_bonus
    elif num_players < BASE_PLAYER_COUNT:
        # Fewer players = less time needed
        missing_players = BASE_PLAYER_COUNT - num_players
        time_reduction = missing_players * TIME_PER_MISSING_PLAYER
        return max(20, base_time - time_reduction)  # Minimum 20 seconds
    else:
        # Exactly base player count
        return base_time