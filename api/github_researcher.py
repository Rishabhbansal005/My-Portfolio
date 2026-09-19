import requests
import json

def fetch_github_data(project_name: str) -> str:
    """
    Fetches live context about a project directly from GitHub to feed into the AI insights.
    Whenever changes are pushed to GitHub, this fetches the latest README and metadata.
    If the repo is private, rate-limited, or 404, it uses the fallback context as a safety net.
    """
    # Map portfolio UI keys to exact GitHub repo paths (username/repo)
    repo_mapping = {
        "ccid": "Rishabhbansal005/Cyber-Security-Investigation-Dashboard",
        "somnio": "Sarthaksinghcse/Somnio-project",
        "indian-heritage": "Rishabhbansal005/Indian-Heritage-and-Culture"
    }

    fallback_contexts = {
        "ccid": (
            "Project: CCID (Cyber Crime Investigation Dashboard / Intelligence & Detection).\n"
            "Tech Stack: Python, FastAPI, React, TypeScript, PostgreSQL (Supabase), PyTorch, XGBoost, Scikit-learn, pyshark, Volatility 3.\n"
            "Key Architecture Details:\n"
            "- Unified full-stack DFIR (Digital Forensics & Incident Response) command-center platform replacing 5-6 manual tools (Wireshark, Event Viewer, browser forensics).\n"
            "- TF-IDF + Logistic Regression classifier auto-labeling complaint text into 10+ cybercrime categories (UPI Fraud, Identity Theft, Sextortion).\n"
            "- XGBoost model prioritizing case urgency (High/Medium/Low) based on financial loss, recency, and extracted IOCs.\n"
            "- Fine-tuned EfficientNet-B0 (PyTorch) with Haar Cascade face detection to identify AI-generated (GAN) fake profile photos with manipulation probability scores.\n"
            "- OSINT forensic parsers: pyshark (PCAP network dumps), Volatility 3 (RAM dumps), EVTX (Windows logs), SQLite (browser history), registry (USB history).\n"
            "- Cyber Copilot AI chatbot for case summarization with officer-approval guardrails before entering official reports."
        ),
        "indian-heritage": (
            "Project: Bharat AI – NLP Chatbot for Indian Heritage & Culture Platform.\n"
            "Tech Stack: Python, FastAPI, GroqCloud LLM APIs, JavaScript, Modern CSS/HTML.\n"
            "Key Architecture Details:\n"
            "- LLM-powered context-aware chatbot leveraging GroqCloud ultra-fast inference and FastAPI backend microservices.\n"
            "- Prompt engineering and conversational state handling for context-aware multi-turn dialogues on Indian heritage, monuments, and culture for the Ministry of Culture's Indian Culture Portal.\n"
            "- Re-architected the UI of the official Government of India Indian Culture Portal into a responsive, accessible modern web experience.\n"
            "- Deployed as a live production feature serving real user queries across the platform."
        ),
        "somnio": (
            "Project: Somnio – CBT-I Based Sleep Wellness iOS Application.\n"
            "Tech Stack: Swift, SwiftUI, WatchKit, HealthKit, Speech Framework, Gemini AI API, Core Data, MVVM architecture.\n"
            "Key Architecture Details:\n"
            "- Native iOS and watchOS application applying clinically-backed Cognitive Behavioral Therapy for Insomnia (CBT-I).\n"
            "- Automated sleep tracking with Apple HealthKit using HKObserverQuery for background sleep analysis and companion Apple Watch synchronization.\n"
            "- Bedtime thought dumping and voice emotion journaling via on-device Speech Framework audio transcription.\n"
            "- Integration with Google Gemini AI API to analyze journal logs and sleep patterns, generating personalized, context-aware sleep-improvement recommendations.\n"
            "- Core Data local offline persistence with clean MVVM architecture."
        )
    }
    
    fallback_text = fallback_contexts.get(
        project_name, 
        f"Project context: {project_name}. Please infer the architecture and challenges based on the project name and modern best practices."
    )

    repo_path = repo_mapping.get(project_name)
    if not repo_path:
        _github_cache[project_name] = fallback_text
        return fallback_text
        
    try:
        url = f"https://api.github.com/repos/{repo_path}"
        response = requests.get(url, timeout=2.5)
        context_str = ""
        if response.status_code == 200:
            data = response.json()
            context_str += f"Description: {data.get('description', 'No description')} | Language: {data.get('language', 'Unknown')} | Topics: {', '.join(data.get('topics', []))}\n"
        else:
            return fallback_text
            
        # Fetch README for detailed context
        readme_url = f"https://api.github.com/repos/{repo_path}/readme"
        headers = {'Accept': 'application/vnd.github.v3.raw'}
        readme_response = requests.get(readme_url, headers=headers, timeout=2.5)
        
        if readme_response.status_code == 200:
            # Truncate README to avoid blowing up the context window
            readme_text = readme_response.text[:5000]
            context_str += f"\nREADME Content (Snippet):\n{readme_text}"
        else:
            context_str += f"\n{fallback_text}"
            
        return context_str
    except Exception as e:
        return f"{fallback_text}\n(Note: Live GitHub fetch encountered: {e})"
