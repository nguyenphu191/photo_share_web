import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const ReactionDetailsModal = ({ 
  photoId, 
  isOpen, 
  onClose, 
  initialStats = {} 
}) => {
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [stats, setStats] = useState(initialStats);

  // Danh sách các loại cảm xúc
  const reactionTypes = {
    all: { emoji: '🔥', label: 'Tất cả' },
    like: { emoji: '👍', label: 'Thích' },
    love: { emoji: '❤️', label: 'Yêu thích' },
    haha: { emoji: '😂', label: 'Haha' },
    wow: { emoji: '😮', label: 'Wow' },
    sad: { emoji: '😢', label: 'Buồn' },
    angry: { emoji: '😡', label: 'Tức giận' }
  };

  // Fetch reactions từ server
  const fetchReactions = useCallback(async (type = 'all') => {
    if (!photoId) return;

    try {
      setLoading(true);
      
      const params = type !== 'all' ? { type } : {};
      const response = await axios.get(
        `http://localhost:8000/api/reaction/${photoId}`,
        { params, timeout: 10000 }
      );

      setReactions(response.data.reactions || []);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Lỗi khi tải reactions:', error);
      setReactions([]);
    } finally {
      setLoading(false);
    }
  }, [photoId]);

  // Load reactions khi mở modal
  useEffect(() => {
    if (isOpen && photoId) {
      fetchReactions(selectedType);
    }
  }, [isOpen, photoId, selectedType, fetchReactions]);

  // Xử lý thay đổi filter
  const handleFilterChange = useCallback((type) => {
    setSelectedType(type);
  }, []);

  // Xử lý đóng modal
  const handleClose = useCallback(() => {
    setReactions([]);
    setSelectedType('all');
    onClose();
  }, [onClose]);

  // Format thời gian
  const formatDateTime = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Thời gian không xác định';
    }
  }, []);

  // Tạo avatar URL
  const getUserAvatarUrl = useCallback((user) => {
    if (!user) return '/images/default.jpg';
    if (user.avatar) return `http://localhost:8000${user.avatar}`;
    if (user.last_name) return `/images/${user.last_name.toLowerCase()}.jpg`;
    return '/images/default.jpg';
  }, []);

  if (!isOpen) return null;

  return (
    <div className="reaction-modal-overlay" onClick={handleClose}>
      <div className="reaction-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="reaction-modal-header">
          <h3>Cảm xúc về ảnh này</h3>
          <button 
            className="reaction-modal-close"
            onClick={handleClose}
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="reaction-filter-tabs">
          {Object.entries(reactionTypes).map(([type, info]) => {
            const count = type === 'all' ? stats.total : (stats[type] || 0);
            if (type !== 'all' && count === 0) return null;

            return (
              <button
                key={type}
                className={`reaction-filter-tab ${selectedType === type ? 'active' : ''}`}
                onClick={() => handleFilterChange(type)}
              >
                <span className="tab-emoji">{info.emoji}</span>
                <span className="tab-label">{info.label}</span>
                <span className="tab-count">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Reactions List */}
        <div className="reaction-modal-content">
          {loading ? (
            <div className="reaction-loading">
              <div className="loading-spinner"></div>
              <p>Đang tải cảm xúc...</p>
            </div>
          ) : reactions.length === 0 ? (
            <div className="reaction-empty">
              <div className="empty-icon">😊</div>
              <p>Chưa có cảm xúc nào</p>
            </div>
          ) : (
            <div className="reaction-list">
              {reactions.map((reaction) => (
                <div key={reaction._id} className="reaction-item">
                  <img
                    src={getUserAvatarUrl(reaction.user)}
                    alt={`Avatar của ${reaction.user?.first_name || 'User'}`}
                    className="reaction-user-avatar"
                    onError={(e) => {
                      e.target.src = '/images/default.jpg';
                    }}
                  />
                  <div className="reaction-user-info">
                    <div className="reaction-user-name">
                      {reaction.user ? 
                        `${reaction.user.first_name} ${reaction.user.last_name}` : 
                        'Người dùng không xác định'
                      }
                    </div>
                    <div className="reaction-time">
                      {formatDateTime(reaction.date_time)}
                    </div>
                  </div>
                  <div className="reaction-type">
                    <span className="reaction-type-emoji">
                      {reactionTypes[reaction.type]?.emoji || '👍'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactionDetailsModal;