"""Switch to Google OAuth user model"""

# revision identifiers, used by Alembic.
revision = 'e47070b4aa04'
down_revision = '2bae0d6aafff'
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    # In SQLite we need to use batch mode to alter tables.
    with op.batch_alter_table('users') as batch_op:
        # Drop the old password_hash column
        batch_op.drop_column('password_hash')

        # Add the new google_id column
        batch_op.add_column(
            sa.Column('google_id', sa.String(256), nullable=False)
        )

        # And explicitly create a named UNIQUE constraint on it:
        batch_op.create_unique_constraint(
            'uq_users_google_id',  # <— this is the name
            ['google_id']
        )


def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('uq_users_google_id', type_='unique')
        batch_op.drop_column('google_id')
        # You may want to re-add password_hash on downgrade:
        batch_op.add_column(
            sa.Column('password_hash', sa.String(128), nullable=False)
        )