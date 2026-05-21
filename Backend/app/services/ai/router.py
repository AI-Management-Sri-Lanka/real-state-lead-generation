from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from Backend.app.core.llm_provider import get_llm
from Backend.app.services.ai.prompts import router_system_prompt, router_user_prompt


class Router:
    def __init__(self):
        self.llm = get_llm()

    def chat(self, user_query):
        prompt = ChatPromptTemplate.from_messages([
            ("system", router_system_prompt),
            ("user", router_user_prompt),
        ])

        chain = prompt | self.llm | JsonOutputParser()

        return chain.invoke({
            "user_query": user_query
        })
