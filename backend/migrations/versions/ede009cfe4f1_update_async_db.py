"""update async db

Revision ID: ede009cfe4f1
Revises: 97d3d17d8854
Create Date: 2025-09-14 03:35:27.659035

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
revision: str = 'ede009cfe4f1'
down_revision: Union[str, None] = '97d3d17d8854'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
def upgrade() -> None:
    pass
def downgrade() -> None:
    pass
