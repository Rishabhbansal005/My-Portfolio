from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import sys
import os

# Add root folder to python path so it can find the scripts
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from insight_engine import get_project_insights

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContactForm(BaseModel):
    name: str
    email: str
    message: str

@app.post("/api/contact")
async def handle_contact(form: ContactForm):
    # Attempt to send real email if credentials exist
    email_user = os.getenv("EMAIL_USER")
    email_pass = os.getenv("EMAIL_PASS")
    
    if email_user and email_pass:
        try:
            msg = MIMEMultipart()
            msg['From'] = email_user
            msg['To'] = email_user # You receive your own portfolio messages
            msg['Subject'] = f"Portfolio Contact from {form.name}"
            body = f"Name: {form.name}\nEmail: {form.email}\n\nMessage:\n{form.message}"
            msg.attach(MIMEText(body, 'plain'))
            
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(email_user, email_pass)
            server.sendmail(email_user, email_user, msg.as_string())
            server.quit()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Email sending failed: {str(e)}")
            
    print(f"[CONTACT LOG] Message from {form.name} ({form.email}): {form.message}")
    return {"status": "success", "message": "Message sent!"}

@app.get("/api/project-insights")
async def project_insights(project: str):
    try:
        insights = get_project_insights(project)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
