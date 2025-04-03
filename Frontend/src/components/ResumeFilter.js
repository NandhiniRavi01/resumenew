import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './ResumeFilter.css';

const ResumeFilter = () => {
  const [minAtsScore, setMinAtsScore] = useState(70);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(file => file.type === "application/pdf");
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
};

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files).filter(file => file.type === "application/pdf");
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
};

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.target);

    selectedFiles.forEach((file) => {
      formData.append("resumes", file);
    });

    const token = localStorage.getItem('token');
    if (!token) {
        alert("You must be logged in to access this feature.");
        window.location.href = '/login';
        return;
    }


    const response = await fetch("http://localhost:5000/upload", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${token}`
    },
      body: formData,
    });

    const data = await response.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div class="glass-card">
      <div class="pulse-animation"></div>
      <h1 className="text-center d-flex align-items-center justify-content-center">
        <img
          src="https://www.cubeaisolutions.com/images/svg/cas-logo.svg"
          alt="Logo"
          className="me-2"
          style={{ height: "40px", width: "auto" }}
        />
        CubeAI Resume Analyzer
      </h1>
      <p className="text-center">Upload resumes and filter them based on your Job Description</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Job Description</label>
          <textarea className="input-field" name="job_description" rows="5" placeholder="Paste the job description here..." required></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Minimum Required Experience (in years)</label>
          <input type="number" className="input-field" name="min_experience" min="0" defaultValue="0" />
        </div>

        <div className="mb-3">
          <label className="form-label">Minimum ATS Score</label>
          <input
            type="range"
            className="form-range"
            name="min_ats_score"
            min="0"
            max="100"
            value={minAtsScore}
            onChange={(e) => setMinAtsScore(e.target.value)}
          />
          <span>{minAtsScore}</span>
        </div>

        <div className="form-group">
          <label>Upload Resume</label>
          <div
            className="upload-area"
            id="uploadArea"
            onClick={() => document.getElementById('resumeFile').click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="upload-icon">📄</div>
            <p className="upload-text">Drag & Drop your resume or <strong>Click to Upload</strong></p>
            <p className="file-name">{selectedFiles.map(file => file.name).join(", ")}</p>
            <p className="file-count">
              {selectedFiles.length > 0 && `Total Files Uploaded: ${selectedFiles.length}`}
            </p>
            <input type="file" id="resumeFile" accept=".pdf" multiple onChange={handleFileChange} hidden />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-100">Start Filtering</button>
      </form>

      <div className="mt-4">
        {loading && <p>Processing resumes... Please wait.</p>}
        {results.length > 0 && (
          <div>
            <h3>Matching Resumes</h3>
            <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="table table-bordered">
                <thead className="table-primary">
                  <tr>
                    <th>Resume</th>
                    <th>Name</th>
                    <th>Experience</th>
                    <th>ATS Score</th>
                    <th>Skills</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((resume, index) => (
                    <tr key={index}>
                      <td>{resume.filename}</td>
                      <td>{resume.name}</td>
                      <td>{resume.years_of_experience}</td>
                      <td>{resume.ats_score}</td>
                      <td>{resume.skills}</td>
                      <td>{resume.email}</td>
                      <td>{resume.phone}</td>
                      <td>
                      <a 
                          href={`http://localhost:5000/download/${resume.filename}`} 
                          className="btn btn-sm btn-success" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          download
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ResumeFilter;
