from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI()

class WorkflowRequest(BaseModel):
    nodeId: str
    inputs: Dict[str, Any]

@app.get("/")
def health():
    return {"status": "ok"}

@app.post("/execute")
def execute(req: WorkflowRequest):
    return {
        "success": True,
        "output": {
            "message": f"Node {req.nodeId} executed",
            "inputs": req.inputs
        }
    }
