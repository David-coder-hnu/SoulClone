from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, Field, TypeAdapter, field_validator


class ChatMessageEvent(BaseModel):
    type: Literal["message"]
    conversation_id: UUID
    client_message_id: UUID
    content: str = Field(min_length=1, max_length=4000)

    @field_validator("content")
    @classmethod
    def content_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Message content must not be blank")
        return value


class TypingEvent(BaseModel):
    type: Literal["typing"]
    conversation_id: UUID
    is_typing: bool = False


class ReadReceiptEvent(BaseModel):
    type: Literal["read_receipt"]
    conversation_id: UUID
    message_id: UUID


ClientEvent = Annotated[
    ChatMessageEvent | TypingEvent | ReadReceiptEvent,
    Field(discriminator="type"),
]

client_event_adapter = TypeAdapter(ClientEvent)
