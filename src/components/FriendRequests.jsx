import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FriendRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/friend/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (friendId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/friend/respond/${friendId}`, 
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRequests(prev => prev.filter(req => req._id !== friendId));
    } catch (error) {
      console.error('Error responding:', error);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="friend-requests">
      <h3>Lời mời kết bạn ({requests.length})</h3>
      {requests.length === 0 ? (
        <p>Không có lời mời nào</p>
      ) : (
        requests.map(request => (
          <div key={request._id} className="request-item">
            <img src={`http://localhost:8000${request.requester.avatar || '/images/default.jpg'}`} alt="Avatar" />
            <div className="request-info">
              <p>{request.requester.first_name} {request.requester.last_name}</p>
              <div className="request-actions">
                <button onClick={() => respondToRequest(request._id, 'accepted')}>Chấp nhận</button>
                <button onClick={() => respondToRequest(request._id, 'declined')}>Từ chối</button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FriendRequests;