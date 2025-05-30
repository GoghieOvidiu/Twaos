import os
import sys
# Add the backend directory to sys.path (two levels up from env.py)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from alembic import context
from sqlalchemy import engine_from_config, pool
from app import models, database

config = context.config
config.set_main_option("sqlalchemy.url", database.SQLALCHEMY_DATABASE_URL)
connectable = engine_from_config(
    config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool
)

with connectable.connect() as connection:
    context.configure(
        connection=connection,
        target_metadata=models.Base.metadata
    )

    with context.begin_transaction():
        context.run_migrations()