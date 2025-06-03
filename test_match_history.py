#!/usr/bin/env python3
"""
Test script to add sample matches to the database for testing match history functionality.
"""

import os
import sys
import datetime
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def main():
    # Initialize Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    # Get user ID (you'll need to replace this with your actual user ID)
    user_id = input("Enter your user ID (from the logs, e.g., '03f2a2de-329d-457c-8e3c-a53b7cd16fec'): ").strip()
    
    if not user_id:
        print("❌ User ID is required")
        return
    
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
            elo_before = 1000 + (i * 20)
        elif i < 10:
            # Medium difficulty matches
            mode = "Medium" 
            players = 5
            time_taken = 60 + (i * 8)
            elo_before = 1100 + ((i-5) * 15)
        else:
            # Hard matches
            mode = "Hard"
            players = 6
            time_taken = 90 + (i * 5)
            elo_before = 1200 + ((i-10) * 10)
        
        elo_change = 25 if is_win else -15
        if i == 2:  # Make one match an abandonment
            is_win = False
            elo_change = -30
            notes = "Abandoned puzzle"
        elif i == 7:  # Make one match a give up
            is_win = False
            elo_change = -20
            notes = "Gave up"
        else:
            notes = None
        
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
        
        if notes:
            match_data["notes"] = notes
            
        sample_matches.append(match_data)
    
    # Insert matches
    try:
        print(f"🔄 Inserting {len(sample_matches)} sample matches...")
        result = supabase.table("matches").insert(sample_matches).execute()
        print(f"✅ Successfully inserted {len(result.data)} matches")
        
        # Show the most recent matches
        print("\n📊 Most recent matches:")
        for i, match in enumerate(sorted(sample_matches, key=lambda x: x["created_at"], reverse=True)[:5]):
            result_icon = "🏆" if match["solved"] else ("🚪" if match.get("notes") == "Abandoned puzzle" else "💔")
            print(f"  {i+1}. {result_icon} {match['mode']} - {'WIN' if match['solved'] else 'LOSS'} ({match['elo_change']:+d} ELO)")
        
        print(f"\n✅ Test data created! You can now test the match history refresh functionality.")
        print(f"💡 Go to your ELO panel and click the refresh button to see the new matches.")
        
    except Exception as e:
        print(f"❌ Failed to insert matches: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 