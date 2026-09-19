import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq
from .github_researcher import fetch_github_data

# Ensure .env is loaded regardless of invocation working directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

def get_project_insights(project_name: str) -> str:
    """
    Combines live GitHub README & data with Groq LLM inference to generate a real-time technical architecture review.
    Whenever code or README changes are pushed to GitHub, this analyzes the new version.
    """
    # 1. Fetch live info from GitHub repository
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
    GitHub Data & Architecture Context: 
    {repo_info}
    
    Write an accurate and impressive technical review in Markdown format. 
    Use the provided data to highlight real architectural features, algorithms, and tech stack details. 
    Write in clear, authoritative yet easy-to-understand language. Use short, readable paragraphs (avoid too many bullet points). Keep the total length moderate.
    
    Include exactly these four sections (using ### headers):
    ### The Problem & The Solution
    ### Architecture Overview
    ### Key Technical Decisions
    ### Challenges Solved
    
    In the first section ("The Problem & The Solution"), clearly explain what real-world problem was tackled and how this project solved it.
    Focus on real details from the project context. Do not output anything other than the markdown text.
    """
    
    models_to_try = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "groq/compound"]
    
    last_err = None
    for model_name in models_to_try:
        try:
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are a senior technical architect reviewing a developer portfolio. You analyze system architectures to provide accurate technical reviews."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=1200,
            )
            content = completion.choices[0].message.content
            if content and content.strip():
                return content.strip()
        except Exception as e:
            last_err = e
            continue
            
    return f"Error generating insights from Groq: {str(last_err)}"
