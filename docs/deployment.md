# Deployment Guide

## Prerequisites

- Docker & Docker Compose
- OpenAI API Key (or Anthropic API Key)
- Git

## Quick Start

```bash
git clone <repo-url>
cd soulclone
cp .env.example .env
# Edit .env and set OPENAI_API_KEY
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for distillation and clone runtime |
| `ANTHROPIC_API_KEY` | No | Optional Claude API key |
| `SECRET_KEY` | Yes | JWT signing secret (generate random 32+ chars) |
| `DB_PASSWORD` | No | Defaults to `soulclone_secret` |
| `ENVIRONMENT` | No | `development` or `production` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |

## Production Checklist

- [ ] Change `SECRET_KEY` to a cryptographically secure random string
- [ ] Set `ENVIRONMENT=production`
- [ ] Configure proper `CORS_ORIGINS`
- [ ] Enable TLS/SSL (reverse proxy with Nginx/Caddy)
- [ ] Set up PostgreSQL backups
- [ ] Configure Redis persistence (AOF or RDB)
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure log aggregation
- [ ] Set LLM API rate limits and budget alerts
- [ ] Review and tighten rate limiting thresholds

## Scaling Considerations

- **Database**: Use connection pooling (PgBouncer) for high concurrency
- **Redis**: Use Redis Cluster for session/queue scaling
- **Celery**: Scale workers horizontally based on queue depth
- **LLM Costs**: Implement caching for similar distillation inputs; use cheaper models for simple tasks
