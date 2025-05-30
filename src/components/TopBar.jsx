import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import QRGenerator from './QRGenerator';
import QRScanner from './QRScanner';

const TopBar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [showQR, setShowQR] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

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

    // Xử lý QR scan
    const handleQRScan = useCallback(async (qrData) => {
        try {
            console.log('🔍 QR Data scanned:', qrData);
            
            // Extract userId from QR data (link format: domain/add-friend/userId)
            const match = qrData.match(/\/add-friend\/([a-f\d]{24})$/);
            if (!match) {
                alert('QR code không hợp lệ');
                setShowScanner(false);
                return;
            }

            const friendUserId = match[1];
            const token = localStorage.getItem('token');
            
            if (!token) {
                alert('Bạn cần đăng nhập để kết bạn');
                setShowScanner(false);
                navigate('/login');
                return;
            }

            // Check không tự kết bạn với mình
            if (friendUserId === user?._id) {
                alert('Không thể kết bạn với chính mình!');
                setShowScanner(false);
                return;
            }

            console.log('📤 Sending friend request to:', friendUserId);

            // Gửi friend request
            const response = await axios.post('http://localhost:8000/api/friend/send-request', 
                { recipientId: friendUserId },
                { 
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000
                }
            );
            
            console.log('✅ Friend request sent:', response.data);
            alert('Đã gửi lời mời kết bạn thành công!');
            setShowScanner(false);
            
        } catch (error) {
            console.error('❌ QR scan error:', error);
            
            let errorMessage = 'Không thể gửi lời mời kết bạn';
            if (error.response?.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                navigate('/login');
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }
            
            alert(errorMessage);
            setShowScanner(false);
        }
    }, [navigate, user]);

    // Xử lý logout
    const handleLogout = useCallback(() => {
        const confirmLogout = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
        if (confirmLogout) {
            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            
            // Reset user state
            setUser(null);
            
            // Reset modals
            setShowQR(false);
            setShowScanner(false);
            
            // Redirect to login
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    // Navigation handlers
    const handleNavigation = useCallback((path) => {
        navigate(path);
    }, [navigate]);

    // Xử lý mở QR Generator
    const handleOpenQR = useCallback(() => {
        if (!user) {
            alert('Bạn cần đăng nhập để chia sẻ link kết bạn');
            return;
        }
        setShowQR(true);
    }, [user]);

    // Xử lý mở QR Scanner
    const handleOpenScanner = useCallback(() => {
        if (!user) {
            alert('Bạn cần đăng nhập để quét QR kết bạn');
            return;
        }
        setShowScanner(true);
    }, [user]);

    // Kiểm tra xem có nên hiển thị TopBar không (ẩn trên login/register)
    const shouldShowTopBar = location.pathname !== '/login' && 
                            location.pathname !== '/register' && 
                            location.pathname !== '/' &&
                            !location.pathname.startsWith('/add-friend');

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

                {/* Friend System Buttons */}
                {user && (
                    <>
                        <button 
                            className="topbar-nav-btn"
                            onClick={handleOpenQR}
                            title="Chia sẻ link kết bạn"
                        >
                            🔗 Chia sẻ
                        </button>
                        <button 
                            className="topbar-nav-btn"
                            onClick={handleOpenScanner}
                            title="Quét QR kết bạn"
                        >
                            📷 Quét QR
                        </button>
                    </>
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
                            onError={(e) => {
                                e.target.src = '/images/default.jpg';
                            }}
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

            {/* QR Generator Modal */}
            {showQR && user && (
                <QRGenerator 
                    userId={user._id} 
                    onClose={() => setShowQR(false)} 
                />
            )}

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScanner 
                    onScanSuccess={handleQRScan} 
                    onClose={() => setShowScanner(false)} 
                />
            )}
        </div>
    );
};

export default TopBar;