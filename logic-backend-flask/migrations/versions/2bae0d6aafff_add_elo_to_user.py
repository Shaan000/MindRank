"""Remove legacy columns (no-op)

Revision ID: 2bae0d6aafff
Revises: 7118c9f85982
Create Date: 2025-05-24 18:25:20.633770
"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '2bae0d6aafff'
down_revision = '7118c9f85982'
branch_labels = None
depends_on = None


def upgrade():
    # schema already matches final model; nothing to do
    pass


def downgrade():
    # nothing to undo
    pass
