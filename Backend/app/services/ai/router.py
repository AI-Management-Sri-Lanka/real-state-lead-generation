from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm_provider import get_llm
from app.services.ai.prompts import router_system_prompt, router_user_prompt
from sqlalchemy import select
from app.models.message import Message

class Router:
    def __init__(self):
        self.llm = get_llm()

    async def chat(self, user_query: str, session_id: str = None, db: AsyncSession = None):
        user_query = user_query.strip()
        
        latest_messages = []

        if session_id and db:
            
            limit_count = 7
            max_history = limit_count - 1
            stmt = select(Message).where(Message.session_id == session_id).order_by(Message.timestamp.desc()).limit(limit_count)
            result = await db.execute(stmt)
            db_messages = result.scalars().all()
            db_messages.reverse()

            if db_messages and db_messages[-1].content == user_query and db_messages[-1].role == "user":
                latest_messages = db_messages[:-1]
            else:
                latest_messages = db_messages[-max_history:]

        messages = [("system", router_system_prompt)]
        for msg in latest_messages:
            messages.append((msg.role, msg.content))
        messages.append(("user", router_user_prompt))

        prompt = ChatPromptTemplate.from_messages(messages)

        chain = prompt | self.llm | JsonOutputParser()

        return await chain.ainvoke({
            "user_query": user_query,
        })
