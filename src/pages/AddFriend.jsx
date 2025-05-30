import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddFriend = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/user/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error('User not found:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async () => {
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Bạn cần đăng nhập để kết bạn');
        navigate('/login');
        return;
      }

      await axios.post('http://localhost:8000/api/friend/send-request', 
        { recipientId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Đã gửi lời mời kết bạn!');
      navigate('/home');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi gửi lời mời');
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="add-friend-page loading">
      <div className="loading-spinner"></div>
      <p>Đang tải thông tin...</p>
    </div>
  );

  if (!user) return (
    <div className="add-friend-page error">
      <div className="error-icon">❌</div>
      <h2>Không tìm thấy người dùng</h2>
      <button onClick={() => navigate('/home')}>Quay lại trang chủ</button>
    </div>
  );

  return (
    <div className="add-friend-page">
      <div className="add-friend-container">
        <div className="user-profile">
          <img 
            src={user.avatar ? `http://localhost:8000${user.avatar}` : '/images/default.jpg'} 
            alt="Avatar" 
            className="profile-avatar"
            onError={(e) => e.target.src = '/images/default.jpg'}
          />
          <h2 className="profile-name">{user.first_name} {user.last_name}</h2>
          {user.occupation && <p className="profile-occupation">💼 {user.occupation}</p>}
          {user.location && <p className="profile-location">📍 {user.location}</p>}
          {user.description && <p className="profile-description">{user.description}</p>}
        </div>
        
        <div className="action-buttons">
          <button 
            className="friend-request-btn"
            onClick={sendFriendRequest}
            disabled={sending}
          >
            {sending ? 'Đang gửi...' : '👥 Gửi lời mời kết bạn'}
          </button>
          <button 
            className="back-btn secondary"
            onClick={() => navigate('/home')}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;