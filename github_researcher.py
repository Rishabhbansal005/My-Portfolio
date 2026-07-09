import requests
import json

def fetch_github_data(project_name: str) -> str:
    """
    Fetches context about a project from GitHub to feed into the AI insights.
    If the repo doesn't exist publicly, provides a fallback context to allow Groq to generate generic insights.
    """
    # Map portfolio UI keys to exact GitHub repo paths (username/repo)
    repo_mapping = {
        "somnio": "Sarthaksinghcse/Somnio-project",
        "navik": "Rishabhbansal005/Navik",
        "indian-heritage": "Rishabhbansal005/Indian-Heritage-and-Culture"
    }
    
    repo_path = repo_mapping.get(project_name)
    
    if not repo_path:
        return f"Project context: {project_name}. No public GitHub data found. Please infer the architecture and challenges based on the project name and standard modern web/app practices."
        
    try:
        url = f"https://api.github.com/repos/{repo_path}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return f"Description: {data.get('description', 'No description')} | Language: {data.get('language', 'Unknown')} | Topics: {', '.join(data.get('topics', []))}"
        else:
            return f"Project context: {project_name}. No public GitHub data found. Please infer the architecture and challenges based on the project name and standard modern web/app practices."
    except Exception as e:
        return f"Error fetching GitHub data: {e}. Provide general technical insights for {project_name}."
