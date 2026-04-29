from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_vector_extension(db: AsyncSession):
    """Ensure pgvector extension is installed"""
    await db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    await db.commit()


async def similarity_search(
    db: AsyncSession,
    table: str,
    vector_column: str,
    query_vector: list[float],
    limit: int = 10,
) -> list[dict]:
    """Perform cosine similarity search using pgvector"""
    query = text(f"""
        SELECT id, 1 - ({vector_column} <=> :qv) AS similarity
        FROM {table}
        ORDER BY {vector_column} <=> :qv
        LIMIT :limit
    """)
    result = await db.execute(query, {"qv": str(query_vector), "limit": limit})
    return [{"id": row[0], "similarity": row[1]} for row in result.fetchall()]
