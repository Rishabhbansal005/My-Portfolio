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
    GitHub Data & README Context: 
    {repo_info}
    
    Write an accurate and impressive technical review in Markdown format. 
    Use the provided README data to highlight real features and facts. 
    Write in simple, easy-to-understand language. Use short, readable paragraphs (avoid too many bullet points). Keep the total length moderate (not too long, not too short).
    
    Include exactly these four sections (using ### headers):
    ### The Problem & The Solution
    ### Architecture Overview
    ### Key Technical Decisions
    ### Challenges Solved
    
    In the first section ("The Problem & The Solution"), clearly explain what problem the user faced and how this project solved it.
    Focus on real details from the README. Do not output anything other than the markdown text.
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a senior technical reviewer for a portfolio. You analyze GitHub READMEs to provide accurate architectural insights."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=1000,
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f"Error generating insights from Groq: {str(e)}"
