from fastapi import FastAPI, Request
from pydantic import BaseModel

app = FastAPI()

class EQRequest(BaseModel):
    response: str
    inflection: dict

def calculate_eq_score(response, inflection):
    score = 0
    if "I feel" in response:
        score += 20
    if inflection.get("pitch", 0) > 1.2:
        score += 15
    if len(response) > 100:
        score += 10
    return score

@app.post("/score")
async def score_endpoint(req: EQRequest):
    eq_score = calculate_eq_score(req.response, req.inflection)
    return {"eq_score": eq_score}
