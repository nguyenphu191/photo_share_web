import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UserList = ({ onSelectUser, selectedUser, onError, onLoadingChange, currentUser }) => {
    // === KHAI BÁO STATE ===
    // State lưu danh sách tất cả users từ server
    const [users, setUsers] = useState([]);
    
    // State quản lý loading khi fetch users
    const [loading, setLoading] = useState(true);
    
    // State quản lý error local cho component này
    const [error, setError] = useState('');
    
    // State lưu thông tin user đang đăng nhập từ localStorage
    const [loggedUser, setLoggedUser] = useState(null);
    
    // State quản lý search (có thể thêm sau)
    const [searchTerm, setSearchTerm] = useState('');

    // Effect để lấy user từ localStorage và fetch danh sách users
    useEffect(() => {
        // Lấy thông tin user đã đăng nhập từ localStorage
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
        
        // Fetch danh sách users
        if (user) {
            fetchUsers();
        }
    }, [onError]);

    // Effect để thông báo loading state lên parent component
    useEffect(() => {
        if (onLoadingChange) {
            onLoadingChange(loading);
        }
    }, [loading, onLoadingChange]);

    // Hàm fetch danh sách users từ server
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(
                'http://localhost:8000/api/user/list',
                {
                    timeout: 10000, // Timeout 10 giây
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Kiểm tra response data
            if (response.data && Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                throw new Error('Dữ liệu không hợp lệ từ server');
            }

        } catch (error) {
            console.error('Lỗi khi fetch users:', error);
            
            let errorMessage = 'Không thể tải danh sách người dùng';
            
            if (error.code === 'NETWORK_ERROR') {
                errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra internet';
            } else if (error.response?.status === 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
            } else if (error.response?.status === 404) {
                errorMessage = 'Không tìm thấy danh sách người dùng';
            }
            
            setError(errorMessage);
            setUsers([]); // Set empty array để tránh lỗi map
            
            // Thông báo error lên parent component
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }, [onError]);

    // Xử lý khi user click vào một user trong danh sách
    const handleUserSelect = useCallback((userId, event) => {
        // Ngăn default action của Link
        if (event) {
            event.preventDefault();
        }

        // Kiểm tra userId hợp lệ
        if (!userId) {
            console.error('User ID không hợp lệ');
            return;
        }

        // Gọi callback để thông báo lên parent component
        if (onSelectUser) {
            onSelectUser(userId);
        }
    }, [onSelectUser]);

    // Xử lý retry khi có lỗi
    const handleRetry = useCallback(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Lọc users để không hiển thị user hiện tại và filter theo search
    const getFilteredUsers = useCallback(() => {
        let filteredUsers = users;

        // Loại bỏ user hiện tại khỏi danh sách
        if (loggedUser?._id) {
            filteredUsers = filteredUsers.filter(user => user._id !== loggedUser._id);
        }

        // Filter theo search term (nếu có)
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filteredUsers = filteredUsers.filter(user => 
                user.first_name?.toLowerCase().includes(searchLower) ||
                user.last_name?.toLowerCase().includes(searchLower) ||
                user.login_name?.toLowerCase().includes(searchLower)
            );
        }

        return filteredUsers;
    }, [users, loggedUser, searchTerm]);

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

    // Kiểm tra user có đang được select không
    const isUserSelected = useCallback((userId) => {
        return selectedUser === userId;
    }, [selectedUser]);

    const filteredUsers = getFilteredUsers();

    return (
        <div className="userhome">
            <div className="userList">
                {/* Header */}
                <h2>Danh sách người dùng</h2>

               
                {loading ? (
                    /* Loading State */
                    <div className="loading-users">
                        <div className="loading-spinner"></div>
                        <p>Đang tải danh sách người dùng...</p>
                    </div>
                ) : error ? (
                    /* Error State */
                    <div className="empty-users">
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
                ) : filteredUsers.length === 0 ? (
                    /* Empty State */
                    <div className="empty-users">
                        <div className="empty-icon">👥</div>
                        <h3>Không có người dùng nào</h3>
                        <p>
                            {searchTerm ? 
                                'Không tìm thấy người dùng phù hợp với từ khóa tìm kiếm' : 
                                'Hiện tại chưa có người dùng nào khác trong hệ thống'
                            }
                        </p>
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="clear-search-btn"
                            >
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>
                ) : (
                    /* Users List */
                    <ul>
                        {filteredUsers.map((user) => (
                            <li 
                                key={user._id} 
                                className={`user ${isUserSelected(user._id) ? 'selected' : ''}`}
                                onClick={(e) => handleUserSelect(user._id, e)}
                            >
                                <Link 
                                    to={`/user/${user._id}`}
                                    onClick={(e) => e.preventDefault()} // Prevent navigation, chỉ dùng để select
                                >
                                    <img 
                                        src={getUserAvatarUrl(user)}
                                        alt={`Avatar của ${user.first_name} ${user.last_name}`}
                                        onError={(e) => {
                                            e.target.src = '/images/default.jpg';
                                        }}
                                    />
                                    <div className="userDetails">
                                        <span>
                                            {user.first_name} {user.last_name}
                                        </span>
                                        {user.occupation && (
                                            <small className="user-occupation">
                                                {user.occupation}
                                            </small>
                                        )}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default UserList;