from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.services.ai.prompts import simple_chat_user_prompt, simple_chat_system_prompt
from app.core.llm_provider import get_llm


class DirectChatTool:
    def __init__(self):
        self.llm = get_llm()

    def chat(self, user_query:str, session_history:str):
        user_query = user_query.strip()
        session_history = session_history.strip()
        prompt = ChatPromptTemplate.from_messages([
            ("system", simple_chat_system_prompt),
            ("user", simple_chat_user_prompt)
        ])

        chain = prompt | self.llm | StrOutputParser()

        return chain.invoke({
            "user_query": user_query,
            "session_history": session_history,
        })