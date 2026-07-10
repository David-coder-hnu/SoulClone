"""Add message idempotency and delivery state.

Revision ID: 20260710_003
Revises: 20260710_002
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260710_003"
down_revision: Union[str, None] = "20260710_002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    delivery_status = sa.Enum(
        "persisted",
        "delivered",
        "read",
        "failed",
        name="message_delivery_status",
    )
    delivery_status.create(op.get_bind(), checkfirst=True)
    op.add_column("messages", sa.Column("client_message_id", sa.Uuid(), nullable=True))
    op.add_column(
        "messages",
        sa.Column(
            "delivery_status",
            delivery_status,
            nullable=False,
            server_default="persisted",
        ),
    )
    op.create_index(
        "ix_messages_client_message_id",
        "messages",
        ["client_message_id"],
        unique=False,
    )
    op.create_unique_constraint(
        "uq_messages_sender_client_message",
        "messages",
        ["sender_id", "client_message_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_messages_sender_client_message",
        "messages",
        type_="unique",
    )
    op.drop_index("ix_messages_client_message_id", table_name="messages")
    op.drop_column("messages", "delivery_status")
    op.drop_column("messages", "client_message_id")
    sa.Enum(name="message_delivery_status").drop(op.get_bind(), checkfirst=True)
