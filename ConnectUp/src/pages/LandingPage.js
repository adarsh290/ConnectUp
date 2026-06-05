import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-title">ConnectUp</h1>
        <p className="landing-tagline">Swipe. Match. Connect. Make new friends at IIT Ropar!</p>
        <p className="landing-description">
          ConnectUp is a friend-making and social networking platform for the campus community. 
          Discover peers who share similar interests, hobbies, and goals. Start building meaningful 
          connections today!
        </p>
        <div className="landing-buttons">
          <Link to="/register" className="btn btn-primary">
            Sign Up
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

