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
    // ⭐ TÁCH RIÊNG error và status để phân biệt rõ ràng
    const [error, setError] = useState(''); // Chỉ cho lỗi thực sự
    const [fetchStatus, setFetchStatus] = useState('loading'); // 'loading', 'success', 'error', 'empty'
    const [searchTerm, setSearchTerm] = useState('');
    const [showQR, setShowQR] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [activeTab, setActiveTab] = useState('discover');

    const navigate = useNavigate();

    // Get current user
    useEffect(() => {
        const getUserFromStorage = () => {
            try {
                const userString = localStorage.getItem('user');
                const token = localStorage.getItem('token');
                
                console.log('🔍 Auth check:', { 
                    hasUser: !!userString, 
                    hasToken: !!token 
                });
                
                if (userString && token) {
                    const user = JSON.parse(userString);
                    setCurrentUser(user);
                    console.log('✅ User logged in:', user.first_name, user.last_name);
                    return user;
                } else {
                    console.log('❌ No auth data');
                    navigate('/login');
                    return null;
                }
            } catch (error) {
                console.error('❌ Auth parse error:', error);
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

    // ⭐ IMPROVED: Fetch với logic phân biệt rõ ràng
    const fetchAvailableUsers = useCallback(async () => {
        try {
            console.log('📡 Starting fetch available users...');
            setLoading(prev => ({ ...prev, users: true }));
            setError(''); // Clear previous errors
            setFetchStatus('loading');

            const token = localStorage.getItem('token');
            if (!token) {
                console.log('❌ No token found');
                setError('Phiên đăng nhập đã hết hạn');
                setFetchStatus('error');
                navigate('/login');
                return;
            }

            console.log('📡 Making API call to /api/user/available...');
            
            const response = await axios.get('http://localhost:8000/api/user/available', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // Tăng timeout lên 15s
            });

            console.log('✅ API Response received:', {
                status: response.status,
                dataType: typeof response.data,
                isArray: Array.isArray(response.data),
                length: response.data?.length || 0,
                data: response.data
            });

            // ⭐ XỬ LÝ RESPONSE: Phân biệt empty vs error
            if (response.status === 200) {
                const userData = response.data || [];
                setUsers(userData);
                
                if (userData.length === 0) {
                    console.log('ℹ️ No available users (normal case)');
                    setFetchStatus('empty'); // Không có users - bình thường
                    setError(''); // Không phải lỗi
                } else {
                    console.log(`✅ Found ${userData.length} available users`);
                    setFetchStatus('success');
                    setError('');
                }
            } else {
                console.log('⚠️ Unexpected status:', response.status);
                setError('Phản hồi từ server không hợp lệ');
                setFetchStatus('error');
                setUsers([]);
            }

        } catch (error) {
            console.error('❌ Fetch error details:', {
                message: error.message,
                code: error.code,
                status: error.response?.status,
                data: error.response?.data
            });
            
            // ⭐ XỬ LÝ CÁC LOẠI LỖI CỤ THỂ
            let errorMessage = '';
            
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Đang chuyển về trang đăng nhập...';
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                setTimeout(() => navigate('/login'), 2000);
            } else if (error.response?.status === 403) {
                errorMessage = 'Không có quyền truy cập';
            } else if (error.response?.status === 404) {
                errorMessage = 'API endpoint không tồn tại';
            } else if (error.response?.status === 500) {
                errorMessage = `Lỗi máy chủ: ${error.response?.data?.error || 'Lỗi server nội bộ'}`;
            } else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Kết nối timeout. Vui lòng kiểm tra internet và thử lại';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Không thể kết nối tới server. Vui lòng kiểm tra server có đang chạy không';
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet';
            } else {
                errorMessage = `Lỗi không xác định: ${error.message}`;
            }
            
            setError(errorMessage);
            setFetchStatus('error');
            setUsers([]);
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

            console.log('📩 Fetching friend requests...');

            const response = await axios.get('http://localhost:8000/api/friend/requests', {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000
            });

            console.log('📩 Friend requests response:', response.data?.length || 0);
            setFriendRequests(response.data || []);

        } catch (error) {
            console.error('Error fetching requests:', error);
            // Friend requests không critical, không cần show error to user
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

    // Manual refresh function
    const handleRefresh = useCallback(() => {
        console.log('🔄 Manual refresh triggered');
        setError('');
        setFetchStatus('loading');
        fetchAvailableUsers();
        fetchFriendRequests();
    }, [fetchAvailableUsers, fetchFriendRequests]);

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
                    <button 
                        className="refresh-btn"
                        onClick={handleRefresh}
                        title="Làm mới"
                        disabled={loading.users}
                    >
                        {loading.users ? '⏳' : '🔄'}
                    </button>
                </div>
            </div>

            {/* ⭐ CHỈ HIỂN THỊ ERROR KHI THỰC SỰ CÓ LỖI */}
            {error && fetchStatus === 'error' && (
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

                        {/* ⭐ LOGIC HIỂN THỊ MỚI: Phân biệt loading, error, empty, success */}
                        {fetchStatus === 'loading' || loading.users ? (
                            /* Loading State */
                            <div className="loading-users">
                                <div className="loading-spinner"></div>
                                <p>Đang tìm kiếm người dùng...</p>
                            </div>
                        ) : fetchStatus === 'error' ? (
                            /* Error State - CHỈ hiển thị khi có lỗi thực sự */
                            <div className="empty-users">
                                <div className="empty-icon">❌</div>
                                <h3>Có lỗi xảy ra</h3>
                                <p>{error}</p>
                                <button 
                                    className="retry-btn"
                                    onClick={handleRefresh}
                                >
                                    🔄 Thử lại
                                </button>
                            </div>
                        ) : fetchStatus === 'empty' || filteredUsers().length === 0 ? (
                            /* Empty State - Không có users hoặc search không ra kết quả */
                            <div className="empty-users">
                                <div className="empty-icon">👥</div>
                                <h3>
                                    {searchTerm ? 
                                        'Không tìm thấy ai' : 
                                        'Không có người dùng có thể kết bạn'
                                    }
                                </h3>
                                <p>
                                    {searchTerm ? 
                                        'Thử tìm kiếm với từ khóa khác' : 
                                        'Bạn đã kết bạn với tất cả mọi người hoặc chưa có ai đăng ký thêm!'
                                    }
                                </p>
                                {!searchTerm && (
                                    <button 
                                        className="retry-btn"
                                        onClick={handleRefresh}
                                    >
                                        🔄 Làm mới
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Success State - Có users để hiển thị */
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
                                            {loading.sendingRequest[user._id] ? '⏳ Đang gửi...' : '👥 Kết bạn'}
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