"""create_cadre_table

Revision ID: dc8077ab752f
Revises: 0ed574713567
Create Date: 2025-06-17 11:49:59.126330

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc8077ab752f'
down_revision: Union[str, None] = '0ed574713567'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
