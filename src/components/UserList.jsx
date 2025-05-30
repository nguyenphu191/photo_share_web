
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserList = ({ onSelectUser, selectedUser, onError, onLoadingChange, currentUser }) => {
    // === KHAI BÁO STATE ===
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [loggedUser, setLoggedUser] = useState(null);
    
    const navigate = useNavigate();

    // Effect để lấy user từ localStorage và fetch danh sách friends
    useEffect(() => {
        const getUserFromStorage = () => {
            try {
                const userString = localStorage.getItem('user');
                if (userString) {
                    const user = JSON.parse(userString);
                    setLoggedUser(user);
                    return user;
                }
                return null;
            } catch (error) {
                console.error('Lỗi khi parse user từ localStorage:', error);
                if (onError) {
                    onError('Phiên đăng nhập không hợp lệ');
                }
                return null;
            }
        };

        const user = getUserFromStorage();
        
        // Fetch danh sách friends
        if (user) {
            fetchFriends();
        }
    }, [onError]);

    // Effect để thông báo loading state lên parent component
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(loading);
        }
    }, [loading, onLoadingChange]);

    // Hàm fetch danh sách friends từ server
    const fetchFriends = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            if (!token) {
                setError('Bạn cần đăng nhập để xem danh sách bạn bè');
                setUsers([]);
                return;
            }

            console.log('📡 Fetching friends list...');

            const response = await axios.get('http://localhost:8000/api/friend/list', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('✅ Friends response:', response.data);

            // Kiểm tra response data
            if (response.data && Array.isArray(response.data)) {
                setUsers(response.data);
                console.log(`📊 Loaded ${response.data.length} friends`);
            } else {
                setUsers([]);
                console.log('📭 No friends data received');
            }

        } catch (error) {
            console.error('❌ Lỗi khi fetch friends:', error);
            
            let errorMessage = 'Không thể tải danh sách bạn bè';
            
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/login');
            } else if (error.response?.status === 404) {
                // 404 có nghĩa là chưa có friends nào - không phải lỗi
                setUsers([]);
                setError('');
                return;
            } else if (error.code === 'NETWORK_ERROR') {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet';
            } else if (error.response?.status === 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
            }
            
            setError(errorMessage);
            setUsers([]);
            
            // Thông báo error lên parent component
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [onError, navigate]);

    // Xử lý khi user click vào một user trong danh sách
    const handleUserSelect = useCallback((userId, event) => {
        if (event) {
            event.preventDefault();
        }

        if (!userId) {
            console.error('User ID không hợp lệ');
            return;
        }

        if (onSelectUser) {
            onSelectUser(userId);
        }
    }, [onSelectUser]);

    // Xử lý retry khi có lỗi
    const handleRetry = useCallback(() => {
        fetchFriends();
    }, [fetchFriends]);

    // Xử lý chuyển đến trang thêm bạn
    const handleGoToAddFriends = useCallback(() => {
        navigate('/add-friends');
    }, [navigate]);

    // Xử lý refresh friends list (gọi từ parent khi có friend request mới)
    const refreshFriends = useCallback(() => {
        fetchFriends();
    }, [fetchFriends]);

    // Expose refresh function to parent
    useEffect(() => {
        if (window.userListRefresh) {
            window.userListRefresh = refreshFriends;
        }
    }, [refreshFriends]);

    // Kiểm tra user có đang được select không
    const isUserSelected = useCallback((userId) => {
        return selectedUser === userId;
    }, [selectedUser]);

    // Tạo URL avatar cho user
    const getUserAvatarUrl = useCallback((user) => {
        if (user?.avatar) {
            return `http://localhost:8000${user.avatar}`;
        }
        if (!user?.last_name) {
            return '/images/default.jpg';
        }
        return `/images/${user.last_name.toLowerCase()}.jpg`;
    }, []);

    return (
        <div className="userhome">
            <div className="userList">
                {/* Header */}
                <div className="userlist-header">
                    <h2>Bạn bè ({users.length})</h2>
                    <button 
                        className="refresh-btn"
                        onClick={handleRetry}
                        disabled={loading}
                        title="Làm mới danh sách"
                    >
                        🔄
                    </button>
                </div>

                {loading ? (
                    /* Loading State */
                    <div className="loading-friends">
                        <div className="loading-spinner"></div>
                        <p>Đang tải danh sách bạn bè...</p>
                    </div>
                ) : error ? (
                    /* Error State */
                    <div className="empty-friends">
                        <div className="empty-icon">❌</div>
                        <h3>Có lỗi xảy ra</h3>
                        <p>{error}</p>
                        <button 
                            onClick={handleRetry}
                            className="retry-btn"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : users.length === 0 ? (
                    /* Empty State - No Friends */
                    <div className="empty-friends">
                        <div className="empty-icon">👥</div>
                        <h3>Chưa có bạn bè nào</h3>
                        <p>Hãy bắt đầu kết bạn để xem và chia sẻ ảnh với mọi người!</p>
                        
                        <div className="empty-actions">
                            <button 
                                className="add-friends-btn primary"
                                onClick={handleGoToAddFriends}
                            >
                                👥 Tìm bạn bè
                            </button>
                            
                            <div className="empty-tips">
                                <p className="tip-title">💡 Cách kết bạn:</p>
                                <ul className="tip-list">
                                    <li>🔗 Chia sẻ link của bạn</li>
                                    <li>📷 Quét mã QR của bạn bè</li>
                                    <li>🔍 Tìm kiếm theo tên</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Friends List */
                    <div className="friends-content">
                        {/* Quick Add Friends Button */}
                        <div className="quick-add-section">
                            <button 
                                className="quick-add-btn"
                                onClick={handleGoToAddFriends}
                                title="Thêm bạn mới"
                            >
                                ➕ Thêm bạn
                            </button>
                        </div>

                        {/* Friends Grid */}
                        <ul className="friends-list">
                            {users.map((user) => (
                                <li 
                                    key={user._id} 
                                    className={`user friend-item ${isUserSelected(user._id) ? 'selected' : ''}`}
                                    onClick={(e) => handleUserSelect(user._id, e)}
                                >
                                    <Link 
                                        to={`/user/${user._id}`}
                                        onClick={(e) => e.preventDefault()}
                                    >
                                        <img 
                                            src={getUserAvatarUrl(user)}
                                            alt={`Avatar của ${user.first_name} ${user.last_name}`}
                                            onError={(e) => {
                                                e.target.src = '/images/default.jpg';
                                            }}
                                        />
                                        <div className="userDetails">
                                            <span className="user-name">
                                                {user.first_name} {user.last_name}
                                            </span>
                                            {user.occupation && (
                                                <small className="user-occupation">
                                                    {user.occupation}
                                                </small>
                                            )}
                                            {user.location && (
                                                <small className="user-location">
                                                    📍 {user.location}
                                                </small>
                                            )}
                                        </div>
                                        
                                        {/* Friend Status Indicator */}
                                        <div className="friend-status">
                                            <span className="status-badge">👥</span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserList;