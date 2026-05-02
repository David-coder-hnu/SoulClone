# SoulClone Backend — Solo Dev Survival Guide

> **David, read this when you feel tired.**
>
> Your backend is already lightweight. You just need to *believe* it.

---

## "Steve" Was Half Right

You received a passionate speech about deleting everything. Here's the truth:

| What Steve Said | Reality |
|-----------------|---------|
| "Delete PostgreSQL" | ✅ You already use SQLite (`soulclone_dev.db`) |
| "Delete Redis" | ✅ You already use fakeredis (in-memory, zero ops) |
| "Delete Alembic" | ✅ You never run it; `init_db()` creates tables automatically |
| "Delete Celery" | ✅ *Almost* — dev mode now runs distillery inline (no worker needed) |
| "Delete tests" | ⚠️ Keep them, but only run `smoke` tests daily |
| "Delete CI/CD" | ✅ You don't have active CI/CD fights right now |

**You are not maintaining a spaceship. You are running a SQLite file + Python process.**

---

## Daily Commands (Memorize These Three)

```powershell
# 1. Start the backend
.\start.ps1

# 2. Run quick tests (< 1 min)
.\run-smoke-tests.ps1

# 3. That's it. There is no step 3.
```

---

## What You Do NOT Need to Do Anymore

| Don't Do | Why |
|----------|-----|
| `alembic revision --autogenerate` | Dev tables auto-create on startup. Only think about migrations if you ship to production. |
| `celery -A celery_worker worker` | Dev mode runs distillery inline via `BackgroundTasks`. No worker process needed. |
| `docker-compose up` | There is no Docker in dev. It's just SQLite. |
| Run full pytest suite | `pytest -m smoke` is your friend. Full suite before big releases only. |
| Worry about WebSocket perf | It works. Don't optimize until you have 100 concurrent users. |

---

## If Something Breaks

| Symptom | Fix |
|---------|-----|
| "Database locked" (SQLite) | Only one process can write. Close other terminals running the app. |
| Celery worker won't start | **Don't start it.** Dev mode doesn't need it anymore. |
| Tests fail with external API | Mark them `@pytest.mark.slow` and skip with `-m smoke`. |
| "Table doesn't exist" | Delete `soulclone_dev.db` and restart `.\start.ps1`. Tables rebuild automatically. |
| Lint errors in old code | Ignore them. Only fix lint in files you are currently editing. |

---

## The "Freeze" Mentality

Your backend has **three jobs**:

1. **Store user data** → SQLite does this. Zero maintenance.
2. **Call AI APIs** → FastAPI `BackgroundTasks` does this in dev. Zero maintenance.
3. **Authenticate users** → JWT middleware does this. Zero maintenance.

Everything else — WebSocket, SSE, periodic tasks — is **frozen**.

> **Frozen means:** If it works, don't touch it. If it breaks, patch it with duct tape. Do not rewrite. Do not optimize. Do not polish.

---

## When to Worry About "Real" Infrastructure

| Milestone | Action |
|-----------|--------|
| 0 users (now) | SQLite + no worker. Sleep well. |
| 100 active users | Still SQLite. Maybe add a backup script. |
| 1,000 users | Consider PostgreSQL on a managed host (Render/Supabase). |
| 10,000 users | Now you can complain about Redis and Celery. And you'll have money to hire help. |

---

## Remember

> "The code you don't write is the code you don't have to debug."
>
> "The infrastructure you don't run is the infrastructure that can't wake you up at 3am."

Your stack is already simple. **Stop feeling guilty about complexity that doesn't exist.**

Now go write a frontend feature or post on 小红书. That's what moves the needle.

---

*Last updated: 2026-05-02*
