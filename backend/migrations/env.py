from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import engine_from_config
from alembic import context
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()
from app.models import SQLModel  
target_metadata = SQLModel.metadata  
DATABASE_URL = os.getenv("DATABASE_URL") 
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
def run_migrations_offline() -> None:
    url = DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()
async def run_migrations_online():
    connectable = create_async_engine(
        DATABASE_URL,
        poolclass=pool.NullPool,
        echo=True,
        future=True
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
async def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()
if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())