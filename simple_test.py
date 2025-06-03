import requests

try:
    print("Testing practice mode...")
    response = requests.post('http://localhost:5000/puzzle/generate', 
                           json={'mode': 'easy', 'players': 4}, 
                           timeout=5)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Success! Generated {data.get('mode')} puzzle with {data.get('num_players')} players")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Error: {e}") 