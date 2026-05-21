from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def read_root():
    return {"AI-Powered Real Estate Lead Generation Platform"}