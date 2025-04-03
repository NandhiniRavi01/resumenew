import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ isSignup }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isSignup ? '/signup' : '/login';
        try {
            const response = await axios.post(`http://localhost:5000${endpoint}`, { email, password });
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                navigate('/resume-filter');
            } else {
                alert(response.data.message);
            }
        } catch (error) {
            alert('Error: ' + error.response?.data?.message || 'Server error');
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center">{isSignup ? 'Signup' : 'Login'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input 
                        type="email" 
                        className="form-control" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input 
                        type="password" 
                        className="form-control" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                    {isSignup ? 'Signup' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default AuthPage;
