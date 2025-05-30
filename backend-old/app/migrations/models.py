import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from alembic import context
from sqlalchemy import engine_from_config, pool
from app.models import Base

# Debugging
print("Current directory:", os.getcwd())
print("Python path:", sys.path)
print("Attempting to import app.models")

config = context.config
config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/sippec_db"))

connectable = engine_from_config(
    config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool
)

with connectable.connect() as connection:
    context.configure(
        connection=connection,
        target_metadata=Base.metadata
    )

    with context.begin_transaction():
        context.run_migrations()