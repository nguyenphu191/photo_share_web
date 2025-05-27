import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TopBar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Lấy thông tin user từ localStorage
    useEffect(() => {
        const getUserInfo = () => {
            try {
                const userString = localStorage.getItem('user');
                if (userString) {
                    const userData = JSON.parse(userString);
                    setUser(userData);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                setUser(null);
            }
        };

        getUserInfo();

        // Listen for storage changes (when user logs in/out in another tab)
        const handleStorageChange = () => {
            getUserInfo();
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [location.pathname]); // Re-check when route changes

    // Tạo avatar URL
    const getUserAvatarUrl = useCallback((user) => {
        if (user?.avatar) {
            return `http://localhost:8000${user.avatar}`;
        }
        if (!user?.last_name) {
            return '/images/default.jpg';
        }
        return `/images/${user.last_name.toLowerCase()}.jpg`;
    }, []);

    // Xử lý logout
    const handleLogout = useCallback(() => {
        const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
        if (confirmLogout) {
            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            
            // Reset user state
            setUser(null);
            
            // Redirect to login
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // Navigation handlers
    const handleNavigation = useCallback((path) => {
        navigate(path);
    }, [navigate]);

    // Kiểm tra xem có nên hiển thị TopBar không (ẩn trên login/register)
    const shouldShowTopBar = location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/';

    if (!shouldShowTopBar) {
        return null;
    }

    return (
        <div className="topBar">
            <div className="topbar-left">
                <button 
                    className="topbar-nav-btn"
                    onClick={() => handleNavigation('/home')}
                    title="Trang chủ"
                >
                    🏠 Trang chủ
                </button>
                
                {user && (
                    <button 
                        className="topbar-nav-btn"
                        onClick={() => handleNavigation('/profile')}
                        title="Trang cá nhân"
                    >
                        👤 Trang cá nhân
                    </button>
                )}
            </div>

            <div className="topbar-center">
                <span className="topbar-title">Photo Share</span>
            </div>

            <div className="topbar-right">
                {user ? (
                    <div className="topbar-user-info">
                        <div className="topbar-user-details">
                            <span className="topbar-username">
                                {user.first_name} {user.last_name}
                            </span>
                            <span className="topbar-user-role">
                                {user.occupation}
                            </span>
                        </div>
                        
                        <img 
                            src={getUserAvatarUrl(user)}
                            alt="User Avatar"
                            className="topbar-avatar"
                        />
                        
                        <button 
                            className="topbar-logout-btn"
                            onClick={handleLogout}
                            title="Đăng xuất"
                        >
                            🚪 Đăng xuất
                        </button>
                    </div>
                ) : (
                    <div className="topbar-auth-buttons">
                        <button 
                            className="topbar-auth-btn"
                            onClick={() => handleNavigation('/login')}
                        >
                            Đăng nhập
                        </button>
                        <button 
                            className="topbar-auth-btn primary"
                            onClick={() => handleNavigation('/register')}
                        >
                            Đăng ký
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopBar;