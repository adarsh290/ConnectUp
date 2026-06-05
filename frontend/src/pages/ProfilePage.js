import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    interests: [],
    profileImageURL: '',
  });
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        interests: user.interests || [],
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

    setUploadingImage(true);
    setError('');

    try {
      const uploadFormData = new FormData(); // renamed to avoid shadowing state
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
      fetchUser();
      return data.profileImageURL; // return URL so callers can use it directly
    } catch (err) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Upload image first if selected, use returned URL directly
      let updatedFormData = { ...formData };
      if (selectedFile) {
        const uploadedUrl = await handleUploadImage();
        if (uploadedUrl) {
          updatedFormData = { ...updatedFormData, profileImageURL: uploadedUrl };
        }
      }

      await api.put('/users/me', updatedFormData);
      fetchUser();
      setIsEditing(false);
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      await api.delete('/users/me');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('Failed to delete account');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/explore')} className="nav-btn">
            Explore
          </button>
          <button onClick={() => navigate('/chat')} className="nav-btn">
            Chat
          </button>
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-image-section">
            {(previewUrl || getImageUrl(user.profileImageURL)) ? (
              <img 
                src={previewUrl || getImageUrl(user.profileImageURL)} 
                alt={user.name} 
                className="profile-image" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentElement.querySelector('.profile-placeholder');
                  if (placeholder) {
                    placeholder.style.display = 'flex';
                  }
                }}
              />
            ) : (
              <div className="profile-placeholder">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-info">
            <h2>{user.name}</h2>
            {user.email && <p className="profile-email">{user.email}</p>}
            {user.branch && <p className="profile-detail">Branch: {user.branch}</p>}
            {user.year && <p className="profile-detail">Year: {user.year}</p>}
            <p className="profile-matches">Matches: {user.matches?.length || 0}</p>

            {!isEditing ? (
              <>
                {user.bio && <p className="profile-bio">{user.bio}</p>}
                {user.interests && user.interests.length > 0 && (
                  <div className="profile-interests">
                    <strong>Interests:</strong>
                    <div className="interests-list">
                      {user.interests.map((interest, index) => (
                        <span key={index} className="interest-tag">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={() => setIsEditing(true)} className="edit-btn">
                  Edit Profile
                </button>
              </>
            ) : (
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="profilePicture">Profile Picture (JPEG or PNG, max 5MB)</label>
                  <input
                    type="file"
                    id="profilePicture"
                    name="profilePicture"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileChange}
                  />
                  {selectedFile && (
                    <p className="file-info">Selected: {selectedFile.name}</p>
                  )}
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

                <div className="form-group">
                  <label htmlFor="interests">Interests</label>
                  <div className="interest-input-group">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddInterest(e)}
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

                {error && <div className="error-message">{error}</div>}

                <div className="edit-actions">
                  <button onClick={handleSave} className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="profile-actions">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
          <button
            onClick={handleDeleteAccount}
            className={`delete-btn ${deleteConfirm ? 'confirm' : ''}`}
          >
            {deleteConfirm ? 'Confirm Delete' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

