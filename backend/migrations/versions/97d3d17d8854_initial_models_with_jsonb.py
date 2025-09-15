"""initial models with jsonb

Revision ID: 97d3d17d8854
Revises: a04508c0fa9a
Create Date: 2025-09-08 17:21:19.961292

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
revision: str = '97d3d17d8854'
down_revision: Union[str, None] = 'a04508c0fa9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
def upgrade() -> None:
    pass
def downgrade() -> None:
    pass