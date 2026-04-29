from app.db.session import init_db


async def on_startup():
    await init_db()


async def on_shutdown():
    pass
