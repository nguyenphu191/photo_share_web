import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddFriend = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/friend/send-request', 
        { recipientId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Đã gửi lời mời kết bạn!');
      navigate('/home');
    } catch (error) {
      alert(error.response?.data?.error || 'Lỗi khi gửi lời mời');
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!user) return <div>Người dùng không tồn tại</div>;

  return (
    <div className="add-friend-page">
      <div className="user-info">
        <img src={`http://localhost:8000${user.avatar || '/images/default.jpg'}`} alt="Avatar" />
        <h2>{user.first_name} {user.last_name}</h2>
        <p>{user.occupation}</p>
        <button onClick={sendFriendRequest}>Kết bạn</button>
      </div>
    </div>
  );
};

export default AddFriend;