from typing import Literal

from pydantic import BaseModel


class CloneReplyReviewRequest(BaseModel):
    decision: Literal["approve", "reject"]
