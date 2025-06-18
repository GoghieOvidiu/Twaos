"""update exams schedule table

Revision ID: update_exams_schedule
Revises: 55c7da3a7bd5
Create Date: 2024-03-19

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_exams_schedule'
down_revision = '55c7da3a7bd5'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Drop existing foreign key constraints
    op.drop_constraint('exams_schedule_course_id_fkey', 'exams_schedule', type_='foreignkey')
    op.drop_constraint('exams_schedule_group_id_fkey', 'exams_schedule', type_='foreignkey')
    op.drop_constraint('exams_schedule_user_id_fkey', 'exams_schedule', type_='foreignkey')
    op.drop_constraint('exams_schedule_assistant_user_id_fkey', 'exams_schedule', type_='foreignkey')
    op.drop_constraint('exams_schedule_classroom_id_fkey', 'exams_schedule', type_='foreignkey')

    # Drop existing columns
    op.drop_column('exams_schedule', 'course_id')
    op.drop_column('exams_schedule', 'group_id')
    op.drop_column('exams_schedule', 'user_id')
    op.drop_column('exams_schedule', 'assistant_user_id')
    op.drop_column('exams_schedule', 'classroom_id')
    op.drop_column('exams_schedule', 'date')

    # Add new columns
    op.add_column('exams_schedule', sa.Column('group', sa.String(), nullable=False))
    op.add_column('exams_schedule', sa.Column('discipline', sa.String(), nullable=False))
    op.add_column('exams_schedule', sa.Column('titular', sa.String(), nullable=False))
    op.add_column('exams_schedule', sa.Column('asistent', sa.String(), nullable=True))
    op.add_column('exams_schedule', sa.Column('data', sa.Date(), nullable=False))
    op.add_column('exams_schedule', sa.Column('ora', sa.Time(), nullable=False))
    op.add_column('exams_schedule', sa.Column('sala', sa.String(), nullable=False))

def downgrade() -> None:
    # Drop new columns
    op.drop_column('exams_schedule', 'sala')
    op.drop_column('exams_schedule', 'ora')
    op.drop_column('exams_schedule', 'data')
    op.drop_column('exams_schedule', 'asistent')
    op.drop_column('exams_schedule', 'titular')
    op.drop_column('exams_schedule', 'discipline')
    op.drop_column('exams_schedule', 'group')

    # Add back original columns
    op.add_column('exams_schedule', sa.Column('date', sa.DateTime(), nullable=False))
    op.add_column('exams_schedule', sa.Column('classroom_id', sa.Integer(), nullable=False))
    op.add_column('exams_schedule', sa.Column('assistant_user_id', sa.Integer(), nullable=True))
    op.add_column('exams_schedule', sa.Column('user_id', sa.Integer(), nullable=False))
    op.add_column('exams_schedule', sa.Column('group_id', sa.Integer(), nullable=False))
    op.add_column('exams_schedule', sa.Column('course_id', sa.Integer(), nullable=False))

    # Add back foreign key constraints
    op.create_foreign_key('exams_schedule_classroom_id_fkey', 'exams_schedule', 'classrooms', ['classroom_id'], ['id'])
    op.create_foreign_key('exams_schedule_assistant_user_id_fkey', 'exams_schedule', 'users', ['assistant_user_id'], ['id'])
    op.create_foreign_key('exams_schedule_user_id_fkey', 'exams_schedule', 'users', ['user_id'], ['id'])
    op.create_foreign_key('exams_schedule_group_id_fkey', 'exams_schedule', 'groups', ['group_id'], ['id'])
    op.create_foreign_key('exams_schedule_course_id_fkey', 'exams_schedule', 'courses', ['course_id'], ['id']) 