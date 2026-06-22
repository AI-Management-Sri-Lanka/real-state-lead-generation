"""Create initial user and lead tables

Revision ID: 06a23e4fd694
Revises: eb9aec3911fd
Create Date: 2026-05-28 09:16:36.284962

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06a23e4fd694'
down_revision: Union[str, Sequence[str], None] = '4cd277bab09f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('platform', sa.String(), nullable=False),
        sa.Column('platform_user_id', sa.String(), nullable=False),
        sa.Column('lead_name', sa.String(), nullable=True),
        sa.Column('messages', sa.JSON(), nullable=True),
        sa.Column('lead_profile', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sessions_id'), 'sessions', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_sessions_id'), table_name='sessions')
    op.drop_table('sessions')
