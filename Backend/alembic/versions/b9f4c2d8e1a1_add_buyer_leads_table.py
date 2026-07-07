"""Add buyer leads table

Revision ID: b9f4c2d8e1a1
Revises: ee129a31d257
Create Date: 2026-07-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9f4c2d8e1a1'
down_revision: Union[str, Sequence[str], None] = 'ee129a31d257'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'buyer_leads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('mobile', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('household_income', sa.String(length=50), nullable=False),
        sa.Column('owns_property', sa.Boolean(), nullable=False),
        sa.Column('available_equity_over_300k', sa.Boolean(), nullable=True),
        sa.Column('deposit_amount', sa.String(length=100), nullable=True),
        sa.Column('age_group', sa.String(length=30), nullable=False),
        sa.Column('superannuation_over_230k', sa.Boolean(), nullable=False),
        sa.Column('australian_state', sa.String(length=50), nullable=False),
        sa.Column('preferred_contact_day', sa.String(length=15), nullable=False),
        sa.Column('preferred_contact_time', sa.String(length=30), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_buyer_leads_id'), 'buyer_leads', ['id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_buyer_leads_id'), table_name='buyer_leads')
    op.drop_table('buyer_leads')
