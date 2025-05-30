ELO_TIERS = [
    {
        "min": 0,
        "max": 499,
        "label": "Beginner Thinker",
        "allowed_modes": {
            "Easy": list(range(3, 7))
        },
        "max_time": {
            "Easy": 60
        }
    },
    {
        "min": 500,
        "max": 999,
        "label": "Intermediate Thinker",
        "allowed_modes": {
            "Easy": list(range(6, 11)),
            "Medium": list(range(6, 9))
        },
        "max_time": {
            "Easy": 40,
            "Medium": 120
        }
    },
    {
        "min": 1000,
        "max": 1499,
        "label": "Advanced Thinker",
        "allowed_modes": {
            "Medium": list(range(8, 11)),
            "Hard": list(range(6, 9))
        },
        "max_time": {
            "Medium": 100,
            "Hard": 180
        }
    },
    {
        "min": 1500,
        "max": float('inf'),
        "label": "Critical Thinker",
        "allowed_modes": {
            "Hard": list(range(10, 16))
        },
        "max_time": {
            "Hard": 180
        }
    }
]

K_WIN = {
    "Beginner Thinker": 10,
    "Intermediate Thinker": 9,
    "Advanced Thinker": 7,
    "Critical Thinker": 4
}

K_LOSS = {
    "Beginner Thinker": 4,
    "Intermediate Thinker": 6,
    "Advanced Thinker": 8,
    "Critical Thinker": 10
}

def get_tier(player_elo):
    for tier in ELO_TIERS:
        if tier["min"] <= player_elo <= tier["max"]:
            return tier
    return None

def compute_elo_change(player_elo, mode, num_players, time_taken_sec, solved):
    tier = get_tier(player_elo)
    if not tier:
        return 0, "❌ Could not determine ELO tier."

    tier_label = tier["label"]
    allowed_players = tier["allowed_modes"].get(mode, [])
    if num_players not in allowed_players:
        return 0, f"📉 No ELO change — {mode} with {num_players} players is not valid for tier '{tier_label}'."

    max_time = tier["max_time"].get(mode, float('inf'))
    mode_weight = {"Easy": 1, "Medium": 2, "Hard": 3}
    difficulty_score = mode_weight[mode] * num_players

    k_gain = K_WIN[tier_label]
    k_loss = K_LOSS[tier_label]

    if solved:
        if time_taken_sec <= max_time:
            gain = int(k_gain * difficulty_score)
            return gain, f"✅ +{gain} ELO for solving a {mode} puzzle in {time_taken_sec:.0f}s!"
        else:
            return -k_loss, f"⚠️ Too slow for your tier ({tier_label}). -{k_loss} ELO."
    else:
        return -k_loss * 2, f"❌ Incorrect. -{k_loss * 2} ELO for failing the puzzle."

def suggest_puzzle(player_elo):
    tier = get_tier(player_elo)
    if not tier:
        return []

    suggestions = []
    for mode, player_range in tier["allowed_modes"].items():
        for n in player_range:
            suggestions.append((mode, n))
    return suggestions

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