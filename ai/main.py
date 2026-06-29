"""
LifeSaver AI — FastAPI Backend with LangGraph Agent
Demonstrates the agentic architecture with Gemini 2.5 Flash.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Annotated, TypedDict, Literal
from langgraph.graph import StateGraph, END
import google.genai as genai
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="LifeSaver AI Agent API",
    description="AI-powered productivity companion using LangGraph + Gemini 2.5 Flash",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────── Gemini Client ────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def call_gemini(prompt: str, system: str = "") -> str:
    """Call Gemini 2.5 Flash for text generation."""
    if not GEMINI_API_KEY:
        return "GEMINI_API_KEY not configured"
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            system_instruction=system or "You are a productivity AI assistant.",
            temperature=0.7,
        ),
    )
    return response.text or ""


# ──────────── LangGraph Agent State ────────────

class AgentState(TypedDict):
    """State for the LangGraph productivity agent."""
    user_input: str
    task_list: list[dict]
    analysis: str
    plan: str
    action: str
    response: str


# ──────────── Agent Nodes ────────────

def analyze_node(state: AgentState) -> AgentState:
    """Analyze user's input and current tasks to determine what action to take."""
    prompt = f"""User request: {state['user_input']}

Current tasks: {state.get('task_list', [])}

Analyze the user's request and determine the best action:
- "prioritize" if they want task prioritization
- "schedule" if they want scheduling help  
- "decompose" if they want to break down a goal
- "rescue" if they have overdue tasks
- "chat" for general productivity advice

Respond with ONLY the action word."""
    
    analysis = call_gemini(prompt, "You are a task analysis AI. Respond with only one word.")
    action = analysis.strip().lower()
    
    valid_actions = ["prioritize", "schedule", "decompose", "rescue", "chat"]
    if action not in valid_actions:
        action = "chat"
    
    return {**state, "analysis": analysis, "action": action}


def prioritize_node(state: AgentState) -> AgentState:
    """Prioritize tasks using Eisenhower matrix + deadline proximity."""
    prompt = f"""Tasks to prioritize:
{state.get('task_list', [])}

Score each task 0-100 using:
1. Urgency (deadline proximity)
2. Importance (impact on goals)
3. Effort (quick wins vs long tasks)

Provide a ranked list with reasoning."""
    
    response = call_gemini(prompt, "You are an expert productivity coach using the Eisenhower Matrix.")
    return {**state, "response": response}


def schedule_node(state: AgentState) -> AgentState:
    """Create an optimized daily schedule."""
    prompt = f"""Create a time-blocked schedule for today.
Tasks: {state.get('task_list', [])}
Working hours: 9 AM to 6 PM.
Put cognitively demanding tasks in the morning.
Include 15-min breaks between blocks.
Lunch: 12:30-1:30 PM."""
    
    response = call_gemini(prompt, "You are a time management expert. Create detailed schedules.")
    return {**state, "response": response}


def decompose_node(state: AgentState) -> AgentState:
    """Break down a goal into actionable milestones."""
    prompt = f"""Goal to break down: {state['user_input']}

Create 5-8 SMART milestones that are:
- Specific and actionable
- Measurable
- Time-bound
Include time estimates for each."""
    
    response = call_gemini(prompt, "You are a goal-setting coach. Create actionable milestones.")
    return {**state, "response": response}


def rescue_node(state: AgentState) -> AgentState:
    """Create a rescue plan for overdue tasks."""
    prompt = f"""The user has overdue tasks and needs a rescue plan.
Tasks: {state.get('task_list', [])}

Create a recovery plan:
1. Triage: which can be salvaged?
2. New realistic deadlines
3. Step-by-step recovery actions
Be empathetic but action-oriented."""
    
    response = call_gemini(prompt, "You are a crisis management productivity coach.")
    return {**state, "response": response}


def chat_node(state: AgentState) -> AgentState:
    """General productivity chat and advice."""
    prompt = f"""User message: {state['user_input']}
Their tasks: {state.get('task_list', [])}

Provide helpful, concise productivity advice."""
    
    response = call_gemini(prompt, "You are a friendly AI productivity companion.")
    return {**state, "response": response}


def router(state: AgentState) -> Literal["prioritize", "schedule", "decompose", "rescue", "chat"]:
    """Route to the appropriate node based on analysis."""
    return state.get("action", "chat")


# ──────────── Build LangGraph ────────────

workflow = StateGraph(AgentState)

workflow.add_node("analyze", analyze_node)
workflow.add_node("prioritize", prioritize_node)
workflow.add_node("schedule", schedule_node)
workflow.add_node("decompose", decompose_node)
workflow.add_node("rescue", rescue_node)
workflow.add_node("chat", chat_node)

workflow.set_entry_point("analyze")

workflow.add_conditional_edges("analyze", router, {
    "prioritize": "prioritize",
    "schedule": "schedule",
    "decompose": "decompose",
    "rescue": "rescue",
    "chat": "chat",
})

workflow.add_edge("prioritize", END)
workflow.add_edge("schedule", END)
workflow.add_edge("decompose", END)
workflow.add_edge("rescue", END)
workflow.add_edge("chat", END)

agent = workflow.compile()


# ──────────── API Routes ────────────

class AgentRequest(BaseModel):
    user_input: str
    task_list: list[dict] = []

class AgentResponse(BaseModel):
    action: str
    response: str

@app.get("/")
def health():
    return {"status": "running", "service": "LifeSaver AI Agent", "model": "Gemini 2.5 Flash"}

@app.post("/api/agent", response_model=AgentResponse)
async def run_agent(request: AgentRequest):
    """Run the LangGraph productivity agent."""
    try:
        result = agent.invoke({
            "user_input": request.user_input,
            "task_list": request.task_list,
            "analysis": "",
            "plan": "",
            "action": "",
            "response": "",
        })
        return AgentResponse(
            action=result.get("action", "chat"),
            response=result.get("response", "No response generated."),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/prioritize")
async def prioritize(request: AgentRequest):
    """Directly run task prioritization."""
    result = agent.invoke({
        "user_input": "Prioritize my tasks",
        "task_list": request.task_list,
        "analysis": "", "plan": "", "action": "prioritize", "response": "",
    })
    return {"response": result.get("response", "")}

@app.post("/api/schedule")
async def schedule(request: AgentRequest):
    """Directly run schedule generation."""
    result = agent.invoke({
        "user_input": "Schedule my day",
        "task_list": request.task_list,
        "analysis": "", "plan": "", "action": "schedule", "response": "",
    })
    return {"response": result.get("response", "")}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
