import os
import re
import json
import asyncio
from flask import Flask, request, render_template, send_from_directory, jsonify
from PyPDF2 import PdfReader
import google.generativeai as genai
from urllib.parse import quote
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
UPLOAD_DIRECTORY = "uploaded_resumes"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

API_KEYS = [
    "AIzaSyAYIIwHicFzIv2gYRUvk2pfEsnqVje9TfA",
    "AIzaSyAznPx4tiDhm5hnt1w1qQSoNjxEQgV4KUQ",
    "AIzaSyDmbj626LuMQwAJcmaJZwzdYfOdR_U96KI",
    "AIzaSyBAyUq6fntEPR4DN7WWWw0KlyTOdrhRUac"
]
current_api_index = 0

def set_api_key():
    global current_api_index
    genai.configure(api_key=API_KEYS[current_api_index])

def rotate_api_key():
    global current_api_index
    current_api_index = (current_api_index + 1) % len(API_KEYS)
    set_api_key()

set_api_key()

def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    return "".join(page.extract_text() or "" for page in reader.pages)

def extract_contact_info(resume_text):
    email_pattern = r'[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+'
    phone_pattern = r'\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}'

    emails = re.findall(email_pattern, resume_text)
    phones = re.findall(phone_pattern, resume_text)

    email = emails[0] if emails else "N/A"
    phone = phones[0] if phones else "N/A"

    return email, phone

def extract_name(resume_text):
    name_pattern = r"[A-Z][a-z]+ [A-Z][a-z]+"
    name = re.findall(name_pattern, resume_text)
    return name[0] if name else "N/A"

def extract_experience(resume_text):
    experience_pattern = r"(\d{1,2}) years of experience in (\w+" 
    experience = re.findall(experience_pattern, resume_text)
    return experience[0] if experience else "N/A"

    

async def analyze_resume(resume_text, job_description, min_experience, min_ats_score):
    prompt = f"""
    You are an advanced ATS system designed to evaluate resumes against job descriptions.
    Extract the candidate's total years of experience by analyzing job roles, work history, and duration mentioned in the resume.

    JOB DESCRIPTION:
    {job_description}
    RESUME CONTENT:
    {resume_text}
    REQUIREMENTS:
    - Extract and return the candidate's Name and total years of experience
    - Provide a structured JSON response with:name, ats_score, meets_requirements, match_details, extracted_skills, years_of_experience.

    Return only valid JSON output.
    """
    while True:
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            json_text = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_text:
                result = json.loads(json_text.group())
            else:
                raise ValueError(f"Invalid JSON response: {response_text}")
            return result
        except Exception:
            rotate_api_key()

@app.route('/')
def index():
    return render_template("index1.html")

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'resumes' not in request.files or 'job_description' not in request.form:
        return jsonify({"error": "Missing files or job description"}), 400
    
    job_description = request.form['job_description']
    min_experience = int(request.form.get('min_experience', 0))
    min_ats_score = int(request.form.get('min_ats_score', 70))
    
    uploaded_files = request.files.getlist('resumes')
    matching_resumes = []
    
    for file in uploaded_files:
        file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
        file.save(file_path)
        
        resume_text = extract_text_from_pdf(file_path)
        email, phone = extract_contact_info(resume_text)
        # name = extract_name(resume_text)
        # experience = extract_experience(resume_text)
        
        analysis = asyncio.run(analyze_resume(resume_text, job_description, min_experience, min_ats_score))
        if analysis["meets_requirements"] and analysis["ats_score"] >= min_ats_score:
            matching_resumes.append({
                "filename": file.filename,
                "name": analysis["name"],
                "years_of_experience": analysis["years_of_experience"],
                # "experience":experience,
                "ats_score": analysis["ats_score"],
                "match_details": analysis["match_details"],
                "skills": analysis["extracted_skills"],
                "email": email,
                "phone": phone,
                "download_link": f"/download/{quote(file.filename)}"
            })
    
    matching_resumes = sorted(matching_resumes, key=lambda x: x["ats_score"], reverse=True)
    return jsonify(matching_resumes)

@app.route('/download/<filename>',methods=['GET'])
def download_file(filename):
    return send_from_directory(UPLOAD_DIRECTORY, filename,as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True,port=5000)
