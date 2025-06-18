"""merge heads before updating exams schedule

Revision ID: 3f44793944a3
Revises: dddd4b6fe127, update_exams_schedule
Create Date: 2025-06-17 13:36:23.636182

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f44793944a3'
down_revision: Union[str, None] = ('dddd4b6fe127', 'update_exams_schedule')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
