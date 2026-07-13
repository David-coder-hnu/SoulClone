"""Add AI reply risk assessment and approval fields.

Revision ID: 20260713_007
Revises: 20260710_006
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260713_007"
down_revision: Union[str, None] = "20260710_006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("clone_reply_jobs", sa.Column("risk_level", sa.String(2), nullable=True))
    op.add_column("clone_reply_jobs", sa.Column("risk_categories", sa.JSON(), nullable=True))
    op.add_column(
        "clone_reply_jobs", sa.Column("risk_confidence", sa.DECIMAL(4, 3), nullable=True)
    )
    op.add_column("clone_reply_jobs", sa.Column("safety_reason", sa.Text(), nullable=True))
    op.add_column(
        "clone_reply_jobs", sa.Column("approval_status", sa.String(20), nullable=True)
    )
    op.add_column(
        "clone_reply_jobs",
        sa.Column("approval_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column("clone_reply_jobs", sa.Column("draft_content", sa.Text(), nullable=True))
    op.add_column(
        "clone_reply_jobs", sa.Column("content_hash", sa.String(64), nullable=True)
    )
    op.add_column(
        "clone_reply_jobs",
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "clone_reply_jobs", sa.Column("reviewed_by_user_id", sa.Uuid(), nullable=True)
    )
    op.create_foreign_key(
        "fk_clone_reply_jobs_reviewed_by_user",
        "clone_reply_jobs",
        "users",
        ["reviewed_by_user_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_clone_reply_jobs_reviewed_by_user",
        "clone_reply_jobs",
        type_="foreignkey",
    )
    op.drop_column("clone_reply_jobs", "reviewed_by_user_id")
    op.drop_column("clone_reply_jobs", "reviewed_at")
    op.drop_column("clone_reply_jobs", "content_hash")
    op.drop_column("clone_reply_jobs", "draft_content")
    op.drop_column("clone_reply_jobs", "approval_expires_at")
    op.drop_column("clone_reply_jobs", "approval_status")
    op.drop_column("clone_reply_jobs", "safety_reason")
    op.drop_column("clone_reply_jobs", "risk_confidence")
    op.drop_column("clone_reply_jobs", "risk_categories")
    op.drop_column("clone_reply_jobs", "risk_level")
