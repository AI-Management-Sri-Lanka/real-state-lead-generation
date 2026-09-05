"""Add Google auth fields to users

Revision ID: f3a7c9b21d44
Revises: 5d334c7aece0
Create Date: 2026-08-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3a7c9b21d44'
down_revision: Union[str, Sequence[str], None] = '5d334c7aece0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Local-password accounts require it; Google-only accounts don't.
    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=True)

    op.add_column('users', sa.Column('google_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)

    op.add_column(
        'users',
        sa.Column('auth_provider', sa.String(), nullable=False, server_default='local'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'auth_provider')

    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_column('users', 'google_id')

    op.alter_column('users', 'hashed_password', existing_type=sa.String(), nullable=False)