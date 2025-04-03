import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import ResumeFilter from './components/ResumeFilter';

const ProtectedRoute  = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};
const App = () => {
  return (
      <Router>
          <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/resume-filter" element={<ProtectedRoute ><ResumeFilter /></ProtectedRoute >} />
              <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
      </Router>
  );
};

export default App;
