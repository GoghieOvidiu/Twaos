"""merge heads before removing user_id from groups

Revision ID: 0aa2957c72b8
Revises: 388e69b6cef8, create_cadre_table
Create Date: 2025-06-17 12:33:03.586757

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0aa2957c72b8'
down_revision: Union[str, None] = ('388e69b6cef8', 'create_cadre_table')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
