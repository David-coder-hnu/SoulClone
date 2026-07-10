"""Add per-user conversation control state.

Revision ID: 20260710_004
Revises: 20260710_003
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260710_004"
down_revision: Union[str, None] = "20260710_003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    control_mode = sa.Enum(
        "clone_active",
        "human_active",
        "clone_cooldown",
        "paused",
        "blocked",
        name="conversation_control_mode",
    )
    control_actor = sa.Enum(
        "human", "system", "admin", name="conversation_control_actor"
    )
    control_mode.create(op.get_bind(), checkfirst=True)
    control_actor.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "conversation_controls",
        sa.Column("conversation_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("mode", control_mode, nullable=False, server_default="clone_active"),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("changed_by", control_actor, nullable=False, server_default="system"),
        sa.Column("reason", sa.String(length=100), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "conversation_id",
            "user_id",
            name="uq_conversation_controls_conversation_user",
        ),
    )
    op.create_index(
        "ix_conversation_controls_conversation_id",
        "conversation_controls",
        ["conversation_id"],
    )
    op.create_index(
        "ix_conversation_controls_user_id",
        "conversation_controls",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_conversation_controls_user_id", table_name="conversation_controls"
    )
    op.drop_index(
        "ix_conversation_controls_conversation_id",
        table_name="conversation_controls",
    )
    op.drop_table("conversation_controls")
    sa.Enum(name="conversation_control_actor").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="conversation_control_mode").drop(op.get_bind(), checkfirst=True)
