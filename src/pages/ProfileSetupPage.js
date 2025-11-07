import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProfileSetupPage.css';

const ProfileSetupPage = () => {
  const { user, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  // Redirect if profile is already complete (after login)
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }
    
    if (user) {
      // Check if profile is complete - user has name and bio
      // If complete, redirect to explore page
      if (user.name && user.bio && user.bio.trim() !== '') {
        setCheckingProfile(false);
        navigate('/explore', { replace: true });
      } else {
        setCheckingProfile(false);
      }
    } else {
      setCheckingProfile(false);
    }
  }, [user, navigate, authLoading]);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    branch: user?.branch || '',
    year: user?.year || '',
    interests: user?.interests || [],
    bio: user?.bio || '',
    profileImageURL: user?.profileImageURL || '',
  });
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        branch: user.branch || '',
        year: user.year || '',
        interests: user.interests || [],
        bio: user.bio || '',
        profileImageURL: user.profileImageURL || '',
      });
      setPreviewUrl(user.profileImageURL || '');
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleAddInterest = (e) => {
    e.preventDefault();
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, interestInput.trim()],
      });
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== interest),
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image/(jpeg|jpg|png)')) {
        setError('Please select a JPEG or PNG image');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('profilePicture', selectedFile);

      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/users/me/upload-profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      setFormData(prev => ({
        ...prev,
        profileImageURL: data.profileImageURL
      }));
      setSelectedFile(null);
      return data.profileImageURL;
    } catch (err) {
      setError(err.message || 'Failed to upload image');
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Upload image first if selected
      if (selectedFile) {
        await handleUploadImage();
      }

      const response = await api.put('/users/me', formData);
      updateUser(response.data);
      navigate('/explore');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking if profile is complete
  if (authLoading || checkingProfile) {
    return (
      <div className="profile-setup-page">
        <div className="profile-setup-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-container">
        <h1>Complete Your Profile</h1>
        <p className="subtitle">Tell us about yourself to help others discover you</p>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <input
                type="text"
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="e.g., CSE, ECE"
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1"
                max="5"
                placeholder="1-5"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="profilePicture">Profile Picture (JPEG or PNG, max 5MB)</label>
            {previewUrl && (
              <div className="image-preview" style={{ marginBottom: '1rem' }}>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' }}
                />
              </div>
            )}
            <input
              type="file"
              id="profilePicture"
              name="profilePicture"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <p className="file-info" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="interests">Interests</label>
            <div className="interest-input-group">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddInterest(e)}
                placeholder="Add an interest and press Enter"
              />
              <button type="button" onClick={handleAddInterest} className="add-interest-btn">
                Add
              </button>
            </div>
            <div className="interests-list">
              {formData.interests.map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="remove-interest"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Tell us about yourself..."
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;

