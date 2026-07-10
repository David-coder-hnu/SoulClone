"""Add LLM gateway trace and usage observability.

Revision ID: 20260710_006
Revises: 20260710_005
"""

from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


revision: str = "20260710_006"
down_revision: Union[str, None] = "20260710_005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "clone_reply_jobs",
        sa.Column("trace_id", sa.Uuid(), nullable=True),
    )
    reply_jobs = sa.table(
        "clone_reply_jobs",
        sa.column("id", sa.Uuid()),
        sa.column("trace_id", sa.Uuid()),
    )
    bind = op.get_bind()
    rows = list(
        bind.execute(
            sa.select(reply_jobs.c.id).where(reply_jobs.c.trace_id.is_(None))
        )
    )
    for row in rows:
        bind.execute(
            reply_jobs.update()
            .where(reply_jobs.c.id == row.id)
            .values(trace_id=uuid.uuid4())
        )
    op.alter_column("clone_reply_jobs", "trace_id", nullable=False)
    op.add_column(
        "llm_usage_logs", sa.Column("provider", sa.String(length=20), nullable=True)
    )
    op.alter_column(
        "llm_usage_logs",
        "model",
        existing_type=sa.String(length=50),
        type_=sa.String(length=100),
        existing_nullable=False,
    )
    op.add_column("llm_usage_logs", sa.Column("trace_id", sa.Uuid(), nullable=True))
    op.add_column(
        "llm_usage_logs",
        sa.Column("request_id", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "llm_usage_logs",
        sa.Column("estimated_cost_usd", sa.DECIMAL(12, 6), nullable=True),
    )
    op.add_column(
        "llm_usage_logs", sa.Column("attempt_count", sa.Integer(), nullable=True)
    )
    op.add_column(
        "llm_usage_logs",
        sa.Column("error_code", sa.String(length=50), nullable=True),
    )
    op.create_index(
        "ix_llm_usage_logs_trace_id",
        "llm_usage_logs",
        ["trace_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_llm_usage_logs_trace_id", table_name="llm_usage_logs")
    op.drop_column("llm_usage_logs", "error_code")
    op.drop_column("llm_usage_logs", "attempt_count")
    op.drop_column("llm_usage_logs", "estimated_cost_usd")
    op.drop_column("llm_usage_logs", "request_id")
    op.drop_column("llm_usage_logs", "trace_id")
    op.alter_column(
        "llm_usage_logs",
        "model",
        existing_type=sa.String(length=100),
        type_=sa.String(length=50),
        existing_nullable=False,
    )
    op.drop_column("llm_usage_logs", "provider")
    op.drop_column("clone_reply_jobs", "trace_id")
