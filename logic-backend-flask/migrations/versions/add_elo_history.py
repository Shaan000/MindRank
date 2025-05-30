"""Add EloHistory table

Revision ID: add_elo_history
Revises: 7118c9f85982
Create Date: 2024-02-14 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_elo_history'
down_revision = '7118c9f85982'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'elo_history',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('elo', sa.Integer(), nullable=False),
        sa.Column('change', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('idx_elo_history_user_id', 'elo_history', ['user_id'])
    op.create_index('idx_elo_history_timestamp', 'elo_history', ['timestamp'])

def downgrade():
    op.drop_index('idx_elo_history_timestamp')
    op.drop_index('idx_elo_history_user_id')
    op.drop_table('elo_history') 