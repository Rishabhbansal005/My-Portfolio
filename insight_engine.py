import os
from groq import Groq
from github_researcher import fetch_github_data

def get_project_insights(project_name: str) -> str:
    """
    Combines GitHub data with Groq's Llama 3 to generate a technical architecture review.
    """
    # 1. Fetch info from Github
    repo_info = fetch_github_data(project_name)
    
    # 2. Setup Groq client
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return "Error: GROQ_API_KEY is missing in the backend .env file. Please add your key to see the AI Insights."
        
    client = Groq(api_key=api_key)
    
    # 3. Prompt engineering for technical review
    prompt = f"""
    You are an expert AI software architect reviewing a portfolio project.
    Project Name: {project_name}
    GitHub Data / Context: {repo_info}
    
    Write a short, impressive technical review in Markdown format.
    Include exactly these three sections (using ### headers):
    ### Architecture Overview
    ### Key Technical Decisions
    ### Challenges Solved
    
    Keep it professional, insightful, and use bullet points where appropriate. Do not output anything other than the markdown text.
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a senior technical reviewer for a portfolio."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=600,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error generating insights from Groq: {str(e)}"
