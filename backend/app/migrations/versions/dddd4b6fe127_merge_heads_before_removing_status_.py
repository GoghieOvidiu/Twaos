"""merge heads before removing status column

Revision ID: dddd4b6fe127
Revises: 0aa2957c72b8, remove_status_column
Create Date: 2025-06-17 13:15:19.583509

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dddd4b6fe127'
down_revision: Union[str, None] = ('0aa2957c72b8', 'remove_status_column')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
