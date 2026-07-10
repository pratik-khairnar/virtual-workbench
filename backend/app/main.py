from fastapi import FastAPI

app = FastAPI(
    title="Virtual Workbench Backend",
    version="1.0.0"
)

@app.get("/")
def root():
    return {"message": "Virtual Workbench Backend is running!"}