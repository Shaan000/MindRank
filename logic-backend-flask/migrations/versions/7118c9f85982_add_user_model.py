"""Add user model (Google OAuth version)

Revision ID: 7118c9f85982
Revises: 
Create Date: 2025-05-24 17:37:07.290863
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7118c9f85982'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('google_id', sa.String(length=256), nullable=False, unique=True),
        sa.Column('email', sa.String(length=120), nullable=False, unique=True),
        sa.Column('elo', sa.Integer(), nullable=False, server_default='1000')
    )


def downgrade():
    op.drop_table('users')