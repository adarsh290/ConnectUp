import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import UserCard from '../components/UserCard';
import './ExplorePage.css';

const ExplorePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchMessage, setMatchMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    interests: [],
    branch: '',
    year: ''
  });
  const [swipeStart, setSwipeStart] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.interests.length > 0) {
        params.append('interests', filters.interests.join(','));
      }
      if (filters.branch) {
        params.append('branch', filters.branch);
      }
      if (filters.year) {
        params.append('year', filters.year);
      }

      const queryString = params.toString();
      const url = queryString ? `/users/explore?${queryString}` : '/users/explore';
      
      const response = await api.get(url);
      setUsers(response.data);
      setCurrentIndex(0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (users.length === 0) return;

    const currentUser = users[currentIndex];
    try {
      const response = await api.post(`/actions/like/${currentUser._id}`);
      
      if (response.data.match) {
        setMatchMessage('It\'s a match! 🎉');
        setTimeout(() => {
          setMatchMessage('');
          handleSkip();
        }, 2000);
      } else {
        handleSkip();
      }
    } catch (error) {
      console.error('Error liking user:', error);
      handleSkip();
    }
  };

  const handleSkip = () => {
    if (currentIndex < users.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more users
      setUsers([]);
      setCurrentIndex(0);
    }
  };

  const handleInterestToggle = (interest) => {
    setFilters(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  };

  const handleBranchChange = (e) => {
    setFilters(prev => ({ ...prev, branch: e.target.value }));
  };

  const handleYearChange = (e) => {
    setFilters(prev => ({ ...prev, year: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      interests: [],
      branch: '',
      year: ''
    });
  };

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setSwipeStart({ x: touch.clientX, y: touch.clientY });
    setIsSwiping(false);
  };

  const handleTouchMove = (e) => {
    if (!swipeStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    
    // Only process horizontal swipes (ignore vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsSwiping(true);
      setSwipeOffset(deltaX);
      e.preventDefault(); // Prevent scrolling during horizontal swipe
    }
  };

  const handleTouchEnd = (e) => {
    if (!swipeStart) {
      setSwipeOffset(0);
      setIsSwiping(false);
      return;
    }

    if (isSwiping) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStart.x;
      const threshold = 100; // Minimum swipe distance

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          // Swipe right - like
          handleLike();
        } else {
          // Swipe left - skip
          handleSkip();
        }
      }
    }

    // Reset swipe state
    setSwipeStart(null);
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  // Mouse drag handlers for desktop
  useEffect(() => {
    if (!swipeStart) return;

    const handleMouseMove = (e) => {
      if (!swipeStart) return;
      
      const deltaX = e.clientX - swipeStart.x;
      const deltaY = e.clientY - swipeStart.y;
      
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        setIsSwiping(true);
        setSwipeOffset(deltaX);
        e.preventDefault();
      }
    };

    const handleMouseUp = (e) => {
      if (!swipeStart) return;
      
      const currentSwipeStart = swipeStart;
      
      // Use a small timeout to get the latest isSwiping state
      setTimeout(() => {
        const deltaX = e.clientX - currentSwipeStart.x;
        const threshold = 100;

        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            handleLike();
          } else {
            handleSkip();
          }
        }
      }, 0);

      setSwipeStart(null);
      setSwipeOffset(0);
      setIsSwiping(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeStart]);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only handle left mouse button
    setSwipeStart({ x: e.clientX, y: e.clientY });
    setIsSwiping(false);
    e.preventDefault();
  };

  // Get unique interests from current user or common interests
  const commonInterests = user?.interests || [];
  const commonBranches = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'CHE', 'MSE', 'BSBE'];
  const years = [1, 2, 3, 4, 5];

  if (loading) {
    return (
      <div className="explore-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="explore-page">
        <div className="explore-header">
          <h1>Explore</h1>
          <div className="header-actions">
            <button onClick={() => navigate('/chat')} className="nav-btn">
              Chat
            </button>
            <button onClick={() => navigate('/profile')} className="nav-btn">
              Profile
            </button>
          </div>
        </div>
        <div className="no-users">
          <h2>No more users to explore</h2>
          <p>You've seen all available users. Check back later for new connections!</p>
          <div className="no-users-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/chat')} className="nav-btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Chat with Matches
            </button>
            <button onClick={() => fetchUsers()} className="nav-btn" style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: '#667eea' }}>
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h1>Explore</h1>
        <div className="header-actions">
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`nav-btn ${showFilters ? 'active' : ''}`}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
          <button onClick={() => navigate('/chat')} className="nav-btn">
            Chat
          </button>
          <button onClick={() => navigate('/profile')} className="nav-btn">
            Profile
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-section">
            <h3>Interests</h3>
            <div className="interests-filter">
              {commonInterests.length > 0 ? (
                commonInterests.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`filter-chip ${filters.interests.includes(interest) ? 'active' : ''}`}
                  >
                    {interest}
                  </button>
                ))
              ) : (
                <p className="no-interests">Add interests to your profile to filter</p>
              )}
            </div>
          </div>

          <div className="filter-section">
            <h3>Branch</h3>
            <select
              value={filters.branch}
              onChange={handleBranchChange}
              className="filter-select"
            >
              <option value="">All Branches</option>
              {commonBranches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3>Year</h3>
            <select
              value={filters.year}
              onChange={handleYearChange}
              className="filter-select"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {matchMessage && (
        <div className="match-message">{matchMessage}</div>
      )}

      {users.length > 0 ? (
        <>
          <div 
            className="user-card-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            style={{
              transform: isSwiping ? `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.1}deg)` : 'translateX(0) rotate(0deg)',
              transition: isSwiping ? 'none' : 'transform 0.3s ease',
              cursor: swipeStart ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <UserCard user={users[currentIndex]} />
              {isSwiping && (
                <div 
                  className="swipe-indicator"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: swipeOffset > 0 ? '20px' : 'auto',
                    right: swipeOffset < 0 ? '20px' : 'auto',
                    transform: 'translateY(-50%)',
                    fontSize: '3rem',
                    opacity: Math.min(Math.abs(swipeOffset) / 150, 1),
                    pointerEvents: 'none',
                    zIndex: 10,
                    transition: 'opacity 0.1s ease'
                  }}
                >
                  {swipeOffset > 0 ? '👍' : '👎'}
                </div>
              )}
            </div>
          </div>

          <div className="swipe-hint" style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
            <p>Swipe left to skip, swipe right to like</p>
          </div>
        </>
      ) : (
        <div className="no-users">
          <h2>No users found</h2>
          <p>Try adjusting your filters or check back later!</p>
          {Object.values(filters).some(f => (Array.isArray(f) ? f.length > 0 : f)) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplorePage;

