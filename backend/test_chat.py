import asyncio
from app.database import connect_db, close_db
from app.models.chat import ChatMessage
from app.models.user import User

async def test():
    await connect_db()
    try:
        msgs = await ChatMessage.find_all().to_list()
        print(f"Total messages: {len(msgs)}")
        for m in msgs:
            print(f"Msg: from={m.sender_id} to={m.receiver_id}")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {str(e)}")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(test())
