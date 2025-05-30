from flask_sqlalchemy import SQLAlchemy

# Initialize SQLAlchemy (to be bound to Flask app in app.py)
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id        = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(256), unique=True, nullable=False)
    email     = db.Column(db.String(120), unique=True, nullable=False)
    elo       = db.Column(db.Integer, default=1000)

    def to_dict(self):
        return {
            'id':    self.id,
            'email': self.email,
            'elo':   self.elo
        }
