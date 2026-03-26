import asyncio
from app.database import connect_db, close_db
from app.models.chat import ChatMessage

async def debug_chat():
    await connect_db()
    try:
        collection = ChatMessage.get_motor_collection()
        cursor = collection.find({})
        docs = await cursor.to_list(length=100)
        print(f"RAW DOCS COUNT: {len(docs)}")
        for d in docs:
            print(f"DOC: {d}")
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(debug_chat())
