// =====================================================
// 2. TẠO TRANG ADD FRIENDS - src/pages/AddFriends.jsx
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import QRGenerator from '../components/QRGenerator';
import QRScanner from '../components/QRScanner';

const AddFriends = () => {
    const [users, setUsers] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState({
        users: true,
        requests: true,
        sendingRequest: {}
    });
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [activeTab, setActiveTab] = useState('discover'); // discover, requests, share

    const navigate = useNavigate();

    // Get current user
    useEffect(() => {
        const getUserFromStorage = () => {
            try {
                const userString = localStorage.getItem('user');
                if (userString) {
                    const user = JSON.parse(userString);
                    setCurrentUser(user);
                    return user;
                } else {
                    navigate('/login');
                    return null;
                }
            } catch (error) {
                console.error('Error parsing user:', error);
                navigate('/login');
                return null;
            }
        };

        const user = getUserFromStorage();
        if (user) {
            fetchAvailableUsers();
            fetchFriendRequests();
        }
    }, [navigate]);

    // Fetch available users (excluding friends and self)
    const fetchAvailableUsers = useCallback(async () => {
        try {
            setLoading(prev => ({ ...prev, users: true }));
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            console.log('🔍 Fetching available users...');

            const response = await axios.get('http://localhost:8000/api/user/available', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('📋 Available users response:', response.data);
            setUsers(response.data || []);

        } catch (error) {
            console.error('❌ Error fetching users:', error);
            
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                setError('Không thể tải danh sách người dùng');
                setUsers([]);
            }
        } finally {
            setLoading(prev => ({ ...prev, users: false }));
        }
    }, [navigate]);

    // Fetch friend requests
    const fetchFriendRequests = useCallback(async () => {
        try {
            setLoading(prev => ({ ...prev, requests: true }));

            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('http://localhost:8000/api/friend/requests', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });

            setFriendRequests(response.data || []);

        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(prev => ({ ...prev, requests: false }));
        }
    }, []);

    // Send friend request
    const sendFriendRequest = useCallback(async (userId) => {
        try {
            setLoading(prev => ({ 
                ...prev, 
                sendingRequest: { ...prev.sendingRequest, [userId]: true }
            }));

            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:8000/api/friend/send-request', 
                { recipientId: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Remove user from available list (request sent)
            setUsers(prev => prev.filter(user => user._id !== userId));
            
            alert('Đã gửi lời mời kết bạn!');

        } catch (error) {
            console.error('Error sending request:', error);
            alert(error.response?.data?.error || 'Không thể gửi lời mời kết bạn');
        } finally {
            setLoading(prev => ({ 
                ...prev, 
                sendingRequest: { ...prev.sendingRequest, [userId]: false }
            }));
        }
    }, []);

    // Respond to friend request
    const respondToRequest = useCallback(async (requestId, action) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8000/api/friend/respond/${requestId}`, 
                { action },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Remove from requests list
            setFriendRequests(prev => prev.filter(req => req._id !== requestId));
            
            if (action === 'accepted') {
                alert('Đã chấp nhận lời mời kết bạn!');
                // Refresh friends list in UserList component
                if (window.userListRefresh) {
                    window.userListRefresh();
                }
            }

        } catch (error) {
            console.error('Error responding to request:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
        }
    }, []);

    // Handle QR scan
    const handleQRScan = useCallback(async (qrData) => {
        try {
            const match = qrData.match(/\/add-friend\/([a-f\d]{24})$/);
            if (!match) {
                alert('QR code không hợp lệ');
                return;
            }

            const friendUserId = match[1];
            if (friendUserId === currentUser?._id) {
                alert('Không thể kết bạn với chính mình!');
                return;
            }

            await sendFriendRequest(friendUserId);
            setShowScanner(false);

        } catch (error) {
            console.error('QR scan error:', error);
            alert('Không thể gửi lời mời kết bạn');
            setShowScanner(false);
        }
    }, [currentUser, sendFriendRequest]);

    // Filter users based on search
    const filteredUsers = useCallback(() => {
        if (!searchTerm.trim()) return users;
        
        const searchLower = searchTerm.toLowerCase();
        return users.filter(user => 
            user.first_name?.toLowerCase().includes(searchLower) ||
            user.last_name?.toLowerCase().includes(searchLower) ||
            user.occupation?.toLowerCase().includes(searchLower) ||
            user.location?.toLowerCase().includes(searchLower)
        );
    }, [users, searchTerm]);

    // Get avatar URL
    const getUserAvatarUrl = useCallback((user) => {
        if (user?.avatar) return `http://localhost:8000${user.avatar}`;
        if (user?.last_name) return `/images/${user.last_name.toLowerCase()}.jpg`;
        return '/images/default.jpg';
    }, []);

    if (!currentUser) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="add-friends-page">
            {/* Header */}
            <div className="add-friends-header">
                <button 
                    className="back-btn"
                    onClick={() => navigate('/home')}
                    title="Quay lại"
                >
                    ← Quay lại
                </button>
                <h1>Kết bạn</h1>
                <div className="header-actions">
                    <button 
                        className="qr-share-btn"
                        onClick={() => setShowQR(true)}
                        title="Chia sẻ QR"
                    >
                        🔗
                    </button>
                    <button 
                        className="qr-scan-btn"
                        onClick={() => setShowScanner(true)}
                        title="Quét QR"
                    >
                        📷
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError('')}>✕</button>
                </div>
            )}

            {/* Tabs */}
            <div className="add-friends-tabs">
                <button 
                    className={`tab ${activeTab === 'discover' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discover')}
                >
                    🔍 Khám phá ({filteredUsers().length})
                </button>
                <button 
                    className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    📩 Lời mời ({friendRequests.length})
                </button>
                <button 
                    className={`tab ${activeTab === 'share' ? 'active' : ''}`}
                    onClick={() => setActiveTab('share')}
                >
                    📤 Chia sẻ
                </button>
            </div>

            {/* Content */}
            <div className="add-friends-content">
                {activeTab === 'discover' && (
                    <div className="discover-tab">
                        {/* Search */}
                        <div className="search-section">
                            <div className="search-container">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên, nghề nghiệp, địa chỉ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="search-input"
                                />
                                <div className="search-icon">🔍</div>
                            </div>
                        </div>

                        {/* Users List */}
                        {loading.users ? (
                            <div className="loading-users">
                                <div className="loading-spinner"></div>
                                <p>Đang tìm kiếm người dùng...</p>
                            </div>
                        ) : filteredUsers().length === 0 ? (
                            <div className="empty-users">
                                <div className="empty-icon">👥</div>
                                <h3>Không tìm thấy ai</h3>
                                <p>
                                    {searchTerm ? 
                                        'Thử tìm kiếm với từ khóa khác' : 
                                        'Bạn đã kết bạn với tất cả mọi người!'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="users-grid">
                                {filteredUsers().map(user => (
                                    <div key={user._id} className="user-card">
                                        <img 
                                            src={getUserAvatarUrl(user)}
                                            alt={`${user.first_name} ${user.last_name}`}
                                            className="user-avatar"
                                            onError={(e) => e.target.src = '/images/default.jpg'}
                                        />
                                        <div className="user-info">
                                            <h4 className="user-name">
                                                {user.first_name} {user.last_name}
                                            </h4>
                                            {user.occupation && (
                                                <p className="user-occupation">💼 {user.occupation}</p>
                                            )}
                                            {user.location && (
                                                <p className="user-location">📍 {user.location}</p>
                                            )}
                                        </div>
                                        <button
                                            className="add-friend-btn"
                                            onClick={() => sendFriendRequest(user._id)}
                                            disabled={loading.sendingRequest[user._id]}
                                        >
                                            {loading.sendingRequest[user._id] ? '...' : '👥 Kết bạn'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="requests-tab">
                        {loading.requests ? (
                            <div className="loading-requests">
                                <div className="loading-spinner"></div>
                                <p>Đang tải lời mời...</p>
                            </div>
                        ) : friendRequests.length === 0 ? (
                            <div className="empty-requests">
                                <div className="empty-icon">📩</div>
                                <h3>Không có lời mời nào</h3>
                                <p>Khi có người gửi lời mời kết bạn, bạn sẽ thấy ở đây</p>
                            </div>
                        ) : (
                            <div className="requests-list">
                                {friendRequests.map(request => (
                                    <div key={request._id} className="request-item">
                                        <img 
                                            src={getUserAvatarUrl(request.requester)}
                                            alt={`${request.requester.first_name} ${request.requester.last_name}`}
                                            className="request-avatar"
                                            onError={(e) => e.target.src = '/images/default.jpg'}
                                        />
                                        <div className="request-info">
                                            <h4 className="request-name">
                                                {request.requester.first_name} {request.requester.last_name}
                                            </h4>
                                            <p className="request-time">
                                                {new Date(request.created_at).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                        <div className="request-actions">
                                            <button
                                                className="accept-btn"
                                                onClick={() => respondToRequest(request._id, 'accepted')}
                                            >
                                                ✅ Chấp nhận
                                            </button>
                                            <button
                                                className="decline-btn"
                                                onClick={() => respondToRequest(request._id, 'declined')}
                                            >
                                                ❌ Từ chối
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'share' && (
                    <div className="share-tab">
                        <div className="share-content">
                            <div className="share-header">
                                <h3>Chia sẻ thông tin kết bạn</h3>
                                <p>Gửi link hoặc QR code này cho bạn bè để họ có thể kết bạn với bạn</p>
                            </div>

                            <div className="share-methods">
                                <button 
                                    className="share-method qr-method"
                                    onClick={() => setShowQR(true)}
                                >
                                    <div className="method-icon">📱</div>
                                    <div className="method-info">
                                        <h4>Mã QR</h4>
                                        <p>Hiển thị mã QR để bạn bè quét</p>
                                    </div>
                                </button>

                                <button 
                                    className="share-method scanner-method"
                                    onClick={() => setShowScanner(true)}
                                >
                                    <div className="method-icon">📷</div>
                                    <div className="method-info">
                                        <h4>Quét QR</h4>
                                        <p>Quét mã QR của bạn bè</p>
                                    </div>
                                </button>
                            </div>

                            <div className="share-stats">
                                <div className="stat-item">
                                    <span className="stat-number">{users.length}</span>
                                    <span className="stat-label">Người có thể kết bạn</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">{friendRequests.length}</span>
                                    <span className="stat-label">Lời mời đang chờ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showQR && currentUser && (
                <QRGenerator 
                    userId={currentUser._id} 
                    onClose={() => setShowQR(false)} 
                />
            )}

            {showScanner && (
                <QRScanner 
                    onScanSuccess={handleQRScan} 
                    onClose={() => setShowScanner(false)} 
                />
            )}
        </div>
    );
};

export default AddFriends;