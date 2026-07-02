from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.core.llm_provider import get_llm
from app.services.ai.prompts import (
    title_generation_system_prompt,
    title_generation_user_prompt,
)


class TitleGenerator:
    """Generates a short, meaningful chat session title from the user's first message."""

    def __init__(self):
        self.llm = get_llm()

    async def generate(self, user_query: str) -> str:
        """
        Call the LLM with the user's first message and return a clean title string.

        Args:
            user_query: The first message sent by the user in a new chat session.

        Returns:
            A short descriptive title (3–8 words) suitable for the chat session.
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", title_generation_system_prompt),
            ("user", title_generation_user_prompt),
        ])

        chain = prompt | self.llm | StrOutputParser()

        raw_title: str = await chain.ainvoke({"user_query": user_query})

        # Sanitize: strip whitespace, quotes, and limit length
        title = raw_title.strip().strip('"').strip("'")

        # Fallback if LLM returns empty
        if not title:
            title = "New Conversation"

        # Hard cap at 80 characters to protect the DB column
        return title[:80]
