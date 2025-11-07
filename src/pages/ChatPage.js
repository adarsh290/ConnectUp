import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSocket, initializeSocket } from '../services/socket';
import api from '../services/api';
import MessageBubble from '../components/MessageBubble';
import { getImageUrl } from '../utils/imageUtils';
import './ChatPage.css';

const ChatPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Ensure socket is initialized
  useEffect(() => {
    if (token && !getSocket()) {
      initializeSocket(token);
    }
  }, [token]);

  const socket = getSocket();

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (selectedUser && socket) {
      loadChatHistory();
      joinRoom();
      setupSocketListeners();
    }

    return () => {
      if (socket && selectedUser) {
        socket.off('receive_message');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
        socket.off('messages_read');
        // Stop typing when leaving chat
        if (isTyping) {
          socket.emit('stop_typing', { receiverId: selectedUser._id });
        }
      }
      // Clear typing state when switching users
      setIsTyping(false);
      setTypingUsers(new Set());
    };
  }, [selectedUser, socket, isTyping]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const fetchMatches = async () => {
    try {
      const response = await api.get('/chat/matches');
      setMatches(response.data);
      if (response.data.length > 0 && !selectedUser) {
        setSelectedUser(response.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await api.get(`/chat/history/${selectedUser._id}`);
      setMessages(response.data);
      
      // Mark messages as read when loading chat
      if (socket && selectedUser) {
        socket.emit('mark_messages_read', { senderId: selectedUser._id });
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const joinRoom = () => {
    if (socket && selectedUser) {
      socket.emit('join_room', selectedUser._id);
    }
  };

  const setupSocketListeners = () => {
    if (socket) {
      socket.on('receive_message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on('user_typing', (data) => {
        if (data.userId === selectedUser?._id) {
          setTypingUsers((prev) => new Set([...prev, data.userId]));
        }
      });

      socket.on('user_stopped_typing', (data) => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      socket.on('messages_read', (data) => {
        // Update read status for messages when other user reads them
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender._id === user.id && !msg.read
              ? { ...msg, read: true }
              : msg
          )
        );
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    // Stop typing indicator
    if (isTyping) {
      socket.emit('stop_typing', { receiverId: selectedUser._id });
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    socket.emit('send_message', {
      receiverId: selectedUser._id,
      content: newMessage.trim(),
    });

    setNewMessage('');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!selectedUser || !socket) return;

    // Start typing indicator
    if (!isTyping) {
      socket.emit('start_typing', { receiverId: selectedUser._id });
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        socket.emit('stop_typing', { receiverId: selectedUser._id });
        setIsTyping(false);
      }
    }, 3000);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="chat-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="chat-page">
        <div className="no-matches">
          <h2>No matches yet</h2>
          <p>Start exploring to find connections!</p>
          <button onClick={() => navigate('/explore')} className="btn-primary">
            Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <h1>Chat</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/explore')} className="nav-btn">
            Explore
          </button>
          <button onClick={() => navigate('/profile')} className="nav-btn">
            Profile
          </button>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-sidebar">
          <h2>Matches</h2>
          <div className="matches-list">
            {matches.map((match) => (
              <div
                key={match._id}
                className={`match-item ${selectedUser?._id === match._id ? 'active' : ''}`}
                onClick={() => setSelectedUser(match)}
              >
                <div className="match-avatar">
                  {getImageUrl(match.profileImageURL) ? (
                    <img src={getImageUrl(match.profileImageURL)} alt={match.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {match.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="match-info">
                  <div className="match-name">{match.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-window">
          {selectedUser ? (
            <>
              <div className="chat-window-header">
                <div className="chat-user-info">
                  {getImageUrl(selectedUser.profileImageURL) ? (
                    <img src={getImageUrl(selectedUser.profileImageURL)} alt={selectedUser.name} />
                  ) : (
                    <div className="avatar-placeholder-small">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{selectedUser.name}</span>
                </div>
              </div>

              <div className="messages-container">
                {messages.map((message) => (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isOwn={message.sender._id === user.id}
                    formatTime={formatTime}
                  />
                ))}
                {typingUsers.has(selectedUser._id) && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">{selectedUser.name} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="message-input-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-btn">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a match to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

