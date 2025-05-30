import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';

const ReactionPicker = ({ photoId, currentUser, userReaction, onReactionChange, disabled }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pickerRef = useRef(null);

  const reactionTypes = [
    { type: 'like', emoji: '👍', label: 'Thích' },
    { type: 'love', emoji: '❤️', label: 'Yêu thích' },
    { type: 'haha', emoji: '😂', label: 'Haha' },
    { type: 'wow', emoji: '😮', label: 'Wow' },
    { type: 'sad', emoji: '😢', label: 'Buồn' },
    { type: 'angry', emoji: '😡', label: 'Tức giận' }
  ];

  // Đóng picker khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPicker]);

  // Xử lý khi chọn reaction
  const handleReactionSelect = useCallback(async (reactionType) => {
    if (!currentUser || isLoading || disabled) return;

    try {
      setIsLoading(true);
      setShowPicker(false);

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Bạn cần đăng nhập để thả cảm xúc');
        return;
      }

      console.log('🎭 Sending reaction:', reactionType, 'for photo:', photoId);

      const response = await axios.post(
        `http://localhost:8000/api/reaction/${photoId}`,
        { type: reactionType },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('🎭 Reaction response:', response.data);

      // Thông báo cho parent component
      if (onReactionChange) {
        onReactionChange(response.data);
      }

    } catch (error) {
      console.error('❌ Lỗi khi thả cảm xúc:', error);
      
      if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      alert('Không thể thả cảm xúc. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, photoId, isLoading, disabled, onReactionChange]);

  // Lấy thông tin reaction hiện tại
  const getCurrentReaction = () => {
    if (!userReaction) return reactionTypes[0]; // Default like
    return reactionTypes.find(r => r.type === userReaction.type) || reactionTypes[0];
  };

  const currentReactionInfo = getCurrentReaction();

  // Debug log
  console.log('🎭 ReactionPicker render:', {
    photoId,
    userReaction,
    showPicker,
    currentUser: !!currentUser
  });

  return (
    <div className="reaction-picker-container" ref={pickerRef}>
      {/* Main Button */}
      <button
        className={`reaction-main-btn ${userReaction ? 'reacted' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={() => {
          console.log('🎭 Main button clicked, showPicker will be:', !showPicker);
          setShowPicker(!showPicker);
        }}
        disabled={disabled || isLoading || !currentUser}
        title={userReaction ? `Bạn đã ${currentReactionInfo.label}` : 'Thả cảm xúc'}
      >
        <span className="reaction-emoji">{currentReactionInfo.emoji}</span>
        <span className="reaction-text">
          {isLoading ? '...' : (userReaction ? currentReactionInfo.label : 'Thích')}
        </span>
      </button>

      {/* Picker Dropdown */}
      {showPicker && currentUser && (
        <div className="reaction-picker-dropdown">
          <div className="reaction-picker-header">
            <span>Chọn cảm xúc</span>
          </div>
          <div className="reaction-options">
            {reactionTypes.map((reaction) => (
              <button
                key={reaction.type}
                className={`reaction-option ${userReaction?.type === reaction.type ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🎭 Reaction option clicked:', reaction.type);
                  handleReactionSelect(reaction.type);
                }}
                disabled={isLoading}
                title={reaction.label}
              >
                <span className="reaction-option-emoji">{reaction.emoji}</span>
                <span className="reaction-option-label">{reaction.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReactionPicker;