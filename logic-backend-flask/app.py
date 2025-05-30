import os
import sys
from datetime import datetime

from flask import Flask, request, jsonify, redirect, url_for, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from flask_dance.contrib.google import make_google_blueprint, google

# ─── App & DB Setup ────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'change-me-in-prod')
CORS(app, supports_credentials=True)

# SQLite database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = \
    'sqlite:///' + os.path.join(basedir, 'mindrank.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# ─── Models ─────────────────────────────────────────────────────────────────
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(256), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    elo = db.Column(db.Integer, default=1000)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'elo': self.elo
        }

class EloHistory(db.Model):
    __tablename__ = 'elo_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    elo = db.Column(db.Integer, nullable=False)
    change = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'date': self.timestamp.isoformat(),
            'elo': self.elo,
            'change': self.change
        }

# ─── Auth Helper Functions ─────────────────────────────────────────────────
def get_user_from_token(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    user_id = auth_header[7:]  # Remove 'Bearer ' prefix
    return User.query.filter_by(google_id=user_id).first()

# ─── Puzzle & ELO Endpoints ────────────────────────────────────────────────
# Import modules from current directory
import easy_mode, medium_mode, hard_mode, ranked_mode, elo_system

@app.route('/puzzle/generate', methods=['POST'])
def generate_puzzle():
    data = request.json
    mode = data.get('mode')
    num_players = data.get('players', 4)
    
    user = None
    if 'Authorization' in request.headers:
        user = get_user_from_token(request.headers['Authorization'])
        if mode == 'ranked' and not user:
            return jsonify({'error': 'Authentication required for ranked mode'}), 401
    
    if mode == 'easy':
        result = easy_mode.api_generate_easy(num_players)
    elif mode == 'medium':
        result = medium_mode.api_generate_medium(num_players)
    elif mode == 'hard':
        result = hard_mode.api_generate_hard(num_players)
    elif mode == 'ranked':
        result = ranked_mode.api_generate_ranked()
    else:
        return jsonify({'error': 'Invalid mode'}), 400
    
    if user:
        result['user_elo'] = user.elo
    
    return jsonify(result)

@app.route('/puzzle/check', methods=['POST'])
def check_solution():
    data = request.json
    mode = data.get('mode')
    
    user = None
    if 'Authorization' in request.headers:
        user = get_user_from_token(request.headers['Authorization'])
        if mode == 'ranked' and not user:
            return jsonify({'error': 'Authentication required for ranked mode'}), 401
    
    if mode == 'easy':
        result = easy_mode.check_easy_solution(data)
    elif mode == 'medium':
        result = medium_mode.check_medium_solution(data)
    elif mode == 'hard':
        result = hard_mode.check_hard_solution(data)
    elif mode == 'ranked':
        result = ranked_mode.check_ranked_solution(data)
    else:
        return jsonify({'error': 'Invalid mode'}), 400
    
    if user and mode == 'ranked' and result.get('valid'):
        # Update user's ELO for ranked games
        old_elo = user.elo
        delta = elo_system.compute_elo_change(
            old_elo,
            data.get('mode'),
            data.get('num_players'),
            data.get('time_taken', 0),
            result.get('valid', False)
        )[0]
        
        user.elo = max(0, old_elo + delta)
        
        # Record ELO history
        history = EloHistory(
            user_id=user.id,
            elo=user.elo,
            change=delta
        )
        db.session.add(history)
        db.session.commit()
        
        result['elo_change'] = {
            'old_elo': old_elo,
            'new_elo': user.elo,
            'change': delta
        }
    
    return jsonify(result)

@app.route('/user/elo', methods=['GET'])
def get_user_elo():
    if 'Authorization' not in request.headers:
        return jsonify({'error': 'Authentication required'}), 401
    
    user = get_user_from_token(request.headers['Authorization'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get ELO history
    history = EloHistory.query.filter_by(user_id=user.id)\
        .order_by(EloHistory.timestamp.desc())\
        .limit(10)\
        .all()
    
    return jsonify({
        'currentElo': user.elo,
        'rank': elo_system.get_tier(user.elo)['label'],
        'history': [h.to_dict() for h in history]
    })

if __name__ == '__main__':
    app.run(debug=True)