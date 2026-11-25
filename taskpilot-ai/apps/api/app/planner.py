from uuid import uuid4

def make_plan(prompt: str):
    words = prompt.strip().split()
    title = " ".join(words[:8]).strip(" .,!?:;")
    if len(title) > 58:
        title = title[:55] + "..."
    steps = [
        {"id": str(uuid4()), "title": "Understand the request",
         "description": "Interpret the goal and identify the information required.",
         "kind": "analysis", "requires_approval": False},
        {"id": str(uuid4()), "title": "Prepare the workflow",
         "description": "Organize the work into clear, reviewable actions.",
         "kind": "planning", "requires_approval": False},
        {"id": str(uuid4()), "title": "Human review checkpoint",
         "description": "Pause for a person to review the proposed outcome before action.",
         "kind": "approval", "requires_approval": True},
    ]
    return title or "New workflow", steps
