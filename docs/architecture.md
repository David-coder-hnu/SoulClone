# SoulClone Architecture

## System Overview

SoulClone is an AI-powered digital twin social platform. The architecture follows a clean separation between the REST API layer, real-time communication layer, AI engine layer, and data layer.

## Data Flow

```
User Registration -> Personality Distillation -> Clone Activation -> Match Discovery -> Chat -> Date Invitation
```

### 1. Registration & Distillation

1. User registers with phone + password
2. Completes personality questionnaire (6 questions)
3. Pastes chat samples for style analysis
4. AI distillation engine processes inputs:
   - `PersonaDistiller.distill()` -> extracts persona core, chat DNA, decision patterns
   - `StyleExtractor.extract()` -> analyzes emoji usage, syntax patterns, tone markers
   - `PromptForge.forge()` -> synthesizes system prompt (2000-3000 tokens)
   - `DistillationValidator.validate()` -> checks consistency, safety, plausibility
5. `CloneProfile` and `Clone` records created in PostgreSQL
6. User status changes from `distilling` to `active`

### 2. Clone Runtime

Every 15 minutes, Celery worker triggers `CloneRuntimeService.evaluate_cycle()`:

1. Fetch all active clones
2. For each clone:
   - Check pending unread messages
   - Evaluate proactive actions (ActionPlanner)
   - Generate responses (ResponseGenerator + MemoryManager + EmotionSimulator)
   - Update emotional state
   - Publish posts/comments (optional, based on social_drive)

Constraints:
- Max 3 deep relationships simultaneously
- Reply delay: 30s - 5min random
- Low activity during 23:00-08:00
- Date proposal only when intimacy >= 80 and distance < 50km

### 3. Matching Algorithm

```python
compatibility_score = (
    vector_similarity * 0.40 +
    interest_overlap * 0.25 +
    personality_complement * 0.20 +
    geo_proximity * 0.10 +
    activity_overlap * 0.05
)
```

Uses pgvector cosine similarity on `clone_profiles.persona_vector`.

### 4. Chat & Takeover

- Messages sent via WebSocket `/ws/chat`
- Human can "takeover" at any moment via WebSocket `takeover` message
- CloneBridge handles AI-generated messages entering the WebSocket stream
- SSE `/api/v1/notifications/stream` pushes real-time alerts

## Technology Stack

| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI (Python 3.12) |
| ORM | SQLAlchemy 2.0 |
| Database | PostgreSQL 16 + pgvector |
| Cache/Queue | Redis 7 + Celery |
| LLM | OpenAI GPT-4o / Claude 3.5 Sonnet |
| Real-time | WebSocket + SSE |
| Frontend | React 19 + TypeScript + TailwindCSS + Framer Motion |
| Container | Docker Compose |

## Database Schema

See `backend/app/models/` for full SQLAlchemy definitions. Key tables:

- `users` — account and profile info
- `clone_profiles` — distilled personality data (JSONB + vector)
- `clones` — runtime state and statistics
- `matches` — match relationships with compatibility scores
- `conversations` — chat sessions with intimacy tracking
- `messages` — individual messages (human or clone sent)
- `takeovers` — human takeover audit log
- `date_invites` — date proposals with AI reasoning
