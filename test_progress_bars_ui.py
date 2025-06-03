#!/usr/bin/env python3
"""
Test script showing how the frontend should display progress bars.
This demonstrates the exact UI layout you want.
"""

import requests
import json

# Your access token (update with fresh one for testing)
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsImtpZCI6Inp2VGNOeklyWTJ3TzY5WVQiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM2NzMzOTQ4LCJpYXQiOjE3MzY3MzAzNDgsImlzcyI6Imh0dHBzOi8vc3d4cGp0d2NqbGJlZHBqYnZ0aHoudGVjaG5vbG9neS5zdXBhYmFzZS5jbyIsInN1YiI6IjAzZjJhMmRlLTMyOWQtNDU3Yy04ZTNjLWE1M2I3Y2QxNmZlYyIsImVtYWlsIjoiY2Fycm90c2hhYW5AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJnb29nbGUiLCJwcm92aWRlcnMiOlsiZ29vZ2xlIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF2YXRhcl91cmwiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NJZG1PRkF3QzNsZ2l3RTMzS2lLT0hUOGNsUXM1eU1zZlJLM0FQVnVZXzNWaWc9czk2LWMiLCJlbWFpbCI6ImNhcnJvdHNoYWFuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmdWxsX25hbWUiOiJTaGFhbiBNYXJzdGVyIiwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tIiwibmFtZSI6IlNoYWFuIE1hcnN0ZXIiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSWRtT0ZBd0MzbGdpd0UzM0tpS09IVDhjbFFzNXlNc2ZSSzNBUFZ1WV8zVmlnPXM5Ni1jIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lkbU9GQXdDM2xnaXdFMzNLaUtPSFQ4Y2xRczV5TXNmUkszQVBWdVlfM1ZpZz1zOTYtYyIsInN1YiI6IjAzZjJhMmRlLTMyOWQtNDU3Yy04ZTNjLWE1M2I3Y2QxNmZlYyJ9fQ.JJ64U44Y7JJfItinVJaeTIK45g3GhDhcfm0Cs4KEYhU"

def test_progress_bar_ui():
    """Test the progress bar UI endpoint and show how frontend should display it."""
    print("🎨 Testing Progress Bar UI System")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    
    try:
        print("📞 Getting progress bar data...")
        response = requests.get('http://localhost:5000/practice/progress-bars', headers=headers, timeout=10)
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            progress_bars = data.get('progress_bars', [])
            
            print("✅ Progress Bar Data Retrieved!")
            print(f"📊 Found {len(progress_bars)} unlocked modes with progress bars")
            
            print("\n🎨 Frontend UI Layout Preview:")
            print("=" * 60)
            
            for bar_data in progress_bars:
                # Display mode title
                print(f"\n📚 {bar_data['title']}")
                
                # Display description  
                print(f"   {bar_data['description']}")
                
                # Display golden progress bar
                if bar_data['show_progress_bar']:
                    percentage = bar_data['percentage']
                    filled_blocks = int(percentage / 5)  # 20 blocks total (5% each)
                    empty_blocks = 20 - filled_blocks
                    
                    # Golden progress bar using Unicode blocks
                    progress_bar = "🟨" * filled_blocks + "⬜" * empty_blocks
                    
                    completion_status = " ✅ COMPLETED!" if bar_data['completed'] else ""
                    
                    print(f"   [{progress_bar}] {bar_data['progress_text']}{completion_status}")
                    print(f"   {percentage:.1f}% Complete")
                
                print("-" * 60)
            
            # Show what unauthenticated users see
            print("\n👤 For Unauthenticated Users:")
            print("   No progress bars shown (clean UI)")
            
        elif response.status_code == 401:
            print("❌ Authentication failed - token may be expired")
            print("\n📱 Frontend should handle this gracefully:")
            print("   - Don't show progress bars")
            print("   - Show clean mode descriptions only")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("🔌 Connection error - is the Flask server running?")
    except Exception as e:
        print(f"❌ Error: {e}")

def show_frontend_implementation_guide():
    """Show how the frontend should implement this."""
    print("\n📝 Frontend Implementation Guide:")
    print("=" * 40)
    
    print("""
🎨 CSS Styling (Golden Theme):
```css
.progress-container {
  margin-top: 8px;
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: rgba(255, 215, 0, 0.2); /* Light golden background */
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FFA500); /* Golden gradient */
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  margin-top: 4px;
  font-size: 12px;
  color: #B8860B; /* Dark golden text */
  font-weight: 500;
}

.completed {
  color: #228B22; /* Green for completed */
}
```

🔧 React Component Example:
```jsx
function PracticeModeCard({ mode }) {
  const [progressData, setProgressData] = useState([]);
  
  useEffect(() => {
    fetch('/practice/progress-bars', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setProgressData(data.progress_bars));
  }, []);
  
  const currentProgress = progressData.find(p => p.mode === mode);
  
  return (
    <div className="mode-card">
      <h3>{mode} Mode</h3>
      <p>{modeDescription}</p>
      
      {currentProgress?.show_progress_bar && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${currentProgress.percentage}%` }}
            />
          </div>
          <div className={`progress-text ${currentProgress.completed ? 'completed' : ''}`}>
            {currentProgress.progress_text}
            {currentProgress.completed && ' ✅ COMPLETED!'}
          </div>
        </div>
      )}
    </div>
  );
}
```

📊 API Response Format:
{
  "progress_bars": [
    {
      "mode": "easy",
      "title": "Easy Mode",
      "description": "Direct truth/lie statements. Perfect for beginners to learn the basics.",
      "show_progress_bar": true,
      "solved": 3,
      "total": 10,
      "percentage": 30.0,
      "completed": false,
      "progress_text": "3/10"
    }
  ]
}
""")

if __name__ == "__main__":
    if ACCESS_TOKEN == "YOUR_FRESH_TOKEN_HERE":
        print("⚠️  For live testing, update ACCESS_TOKEN with a fresh token!")
        print("   For now, showing implementation guide...\n")
        show_frontend_implementation_guide()
    else:
        test_progress_bar_ui()
        show_frontend_implementation_guide() 