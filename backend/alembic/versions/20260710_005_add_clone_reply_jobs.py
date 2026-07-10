"""Add persistent idempotent clone reply jobs.

Revision ID: 20260710_005
Revises: 20260710_004
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260710_005"
down_revision: Union[str, None] = "20260710_004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clone_reply_jobs",
        sa.Column("source_message_id", sa.Uuid(), nullable=False),
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("clone_id", sa.Uuid(), nullable=False),
        sa.Column("reply_message_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="queued"),
        sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("idempotency_key", sa.String(length=150), nullable=False),
        sa.Column("control_version", sa.Integer(), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=True),
        sa.Column("error_code", sa.String(length=50), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("worker_task_id", sa.String(length=100), nullable=True),
        sa.Column("lease_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancel_reason", sa.String(length=100), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["clone_id"], ["clones.id"]),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"]),
        sa.ForeignKeyConstraint(["reply_message_id"], ["messages.id"]),
        sa.ForeignKeyConstraint(["source_message_id"], ["messages.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reply_message_id"),
        sa.UniqueConstraint(
            "idempotency_key", name="uq_clone_reply_jobs_idempotency_key"
        ),
        sa.UniqueConstraint(
            "source_message_id", name="uq_clone_reply_jobs_source_message"
        ),
    )
    op.create_index(
        "ix_clone_reply_jobs_clone_id", "clone_reply_jobs", ["clone_id"]
    )
    op.create_index(
        "ix_clone_reply_jobs_conversation_id",
        "clone_reply_jobs",
        ["conversation_id"],
    )
    op.create_index(
        "ix_clone_reply_jobs_source_message_id",
        "clone_reply_jobs",
        ["source_message_id"],
    )
    op.create_index(
        "ix_clone_reply_jobs_status", "clone_reply_jobs", ["status"]
    )


def downgrade() -> None:
    op.drop_index("ix_clone_reply_jobs_status", table_name="clone_reply_jobs")
    op.drop_index(
        "ix_clone_reply_jobs_source_message_id", table_name="clone_reply_jobs"
    )
    op.drop_index(
        "ix_clone_reply_jobs_conversation_id", table_name="clone_reply_jobs"
    )
    op.drop_index("ix_clone_reply_jobs_clone_id", table_name="clone_reply_jobs")
    op.drop_table("clone_reply_jobs")
