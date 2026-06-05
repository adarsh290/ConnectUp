import React, { useState } from 'react';
import './UserCard.css';
import { getImageUrl } from '../utils/imageUtils';

const UserCard = ({ user }) => {
  const imageUrl = getImageUrl(user.profileImageURL);
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = (e) => {
    console.error('Failed to load profile image:', imageUrl);
    setImageError(true);
    // Hide the broken image
    if (e.target) {
      e.target.style.display = 'none';
    }
  };
  
  return (
    <div className="user-card">
      <div className="user-image">
        {imageUrl && !imageError ? (
          <img 
            src={imageUrl} 
            alt={user.name}
            onError={handleImageError}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div className="placeholder-image">
            <span>{user.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="user-info">
        <h2>{user.name}</h2>
        {user.branch && <p className="user-detail">Branch: {user.branch}</p>}
        {user.year && <p className="user-detail">Year: {user.year}</p>}
        {user.bio && <p className="user-bio">{user.bio}</p>}
        {user.interests && user.interests.length > 0 && (
          <div className="user-interests">
            <strong>Interests:</strong>
            <div className="interests-list">
              {user.interests.map((interest, index) => (
                <span key={index} className="interest-badge">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;

