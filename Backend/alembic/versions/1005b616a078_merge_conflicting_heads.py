"""merge conflicting heads

Revision ID: 1005b616a078
Revises: 3ce64da2758d, a627863d3184
Create Date: 2026-06-25 07:24:14.701294

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1005b616a078'
down_revision: Union[str, Sequence[str], None] = ('3ce64da2758d', 'a627863d3184')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
