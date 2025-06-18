"""remove status column

Revision ID: remove_status_column
Revises: 55c7da3a7bd5
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'remove_status_column'
down_revision = '55c7da3a7bd5'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Drop the status column from exams_schedule table
    op.drop_column('exams_schedule', 'status')
    # Drop the examstatus enum type
    op.execute('DROP TYPE examstatus')

def downgrade() -> None:
    # Recreate the examstatus enum type
    op.execute("CREATE TYPE examstatus AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED')")
    # Add back the status column
    op.add_column('exams_schedule',
        sa.Column('status', sa.Enum('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED', name='examstatus'), nullable=False, server_default='PENDING')
    ) 