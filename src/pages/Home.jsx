import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from "../components/TopBar";
import UserList from "../components/UserList";
import UserPhotos from "../components/UserPhotos";

const Home = () => {
    // State lưu user hiện tại đã được chọn để xem photos
    const [selectedUser, setSelectedUser] = useState(null);
    
    // State quản lý loading cho các operations khác nhau
    const [loading, setLoading] = useState({
        userList: false,      // Loading khi fetch danh sách users
        userPhotos: false     // Loading khi fetch photos của user
    });
    
    // State quản lý lỗi
    const [error, setError] = useState('');
    
    // State lưu thông tin user đã đăng nhập
    const [currentUser, setCurrentUser] = useState(null);
    
    // State quản lý sidebar collapse trên mobile
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Hook điều hướng trang
    const navigate = useNavigate();

    // Kiểm tra authentication khi component mount
    useEffect(() => {
        const checkAuthentication = () => {
            try {
                const userString = localStorage.getItem('user');
                if (!userString) {
                    // Chưa đăng nhập -> chuyển về login
                    navigate('/login', { replace: true });
                    return;
                }
                
                const user = JSON.parse(userString);
                if (!user || !user._id) {
                    // Dữ liệu user không hợp lệ -> clear và chuyển về login
                    localStorage.removeItem('user');
                    navigate('/login', { replace: true });
                    return;
                }
                
                // Set current user
                setCurrentUser(user);
                
            } catch (error) {
                console.error('Lỗi khi parse user từ localStorage:', error);
                localStorage.removeItem('user');
                navigate('/login', { replace: true });
            }
        };

        checkAuthentication();
    }, [navigate]);

    // Cleanup selected user khi component unmount
    useEffect(() => {
        return () => {
            setSelectedUser(null);
        };
    }, []);

    // Xử lý khi user chọn một user từ danh sách để xem photos
    const handleSelectUser = useCallback((userId) => {
        // Kiểm tra userId hợp lệ
        if (!userId) {
            setError('ID người dùng không hợp lệ');
            return;
        }

        // Clear error cũ
        setError('');
        
        // Nếu chọn cùng user thì bỏ chọn (toggle)
        if (selectedUser === userId) {
            setSelectedUser(null);
            return;
        }
        
        // Set user được chọn
        setSelectedUser(userId);
        
        // Đóng sidebar trên mobile sau khi chọn user
        if (window.innerWidth <= 768) {
            setIsSidebarCollapsed(true);
        }
    }, [selectedUser]);


    // Xử lý chuyển đến trang profile cá nhân
    const handleGoToProfile = useCallback(() => {
        navigate('/profile');
    }, [navigate]);

    // Toggle sidebar trên mobile
    const toggleSidebar = useCallback(() => {
        setIsSidebarCollapsed(prev => !prev);
    }, []);

    // Xử lý khi có lỗi từ child components
    const handleError = useCallback((errorMessage) => {
        setError(errorMessage);
        
        // Tự động clear error sau 5 giây
        setTimeout(() => {
            setError('');
        }, 5000);
    }, []);

    // Xử lý loading state từ child components
    const handleLoadingChange = useCallback((loadingType, isLoading) => {
        setLoading(prev => ({
            ...prev,
            [loadingType]: isLoading
        }));
    }, []);

    // Kiểm tra responsive breakpoint
    const isMobile = useCallback(() => {
        return window.innerWidth <= 768;
    }, []);

    // Clear error manually
    const clearError = useCallback(() => {
        setError('');
    }, []);

    // Hiển thị loading nếu chưa check authentication
    if (!currentUser) {
        return (
            <div className="home-loading">
                <div className="loading-spinner"></div>
                <p>Đang kiểm tra thông tin đăng nhập...</p>
            </div>
        );
    }

    return (
        <div className="home-page">
           
            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <span className="error-message">{error}</span>
                    <button 
                        className="error-dismiss"
                        onClick={clearError}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Main Content Container */}
            <div className="home-container">
                {/* Sidebar - User List */}
                <div className={`home-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                    <UserList 
                        selectedUser={selectedUser}
                        onSelectUser={handleSelectUser}
                        onError={handleError}
                        onLoadingChange={(isLoading) => handleLoadingChange('userList', isLoading)}
                        currentUser={currentUser}
                    />
                    
                    {/* Loading Overlay cho User List */}
                    {loading.userList && (
                        <div className="loading-overlay">
                            <div className="loading-spinner"></div>
                            <p>Đang tải danh sách người dùng...</p>
                        </div>
                    )}
                </div>

                {/* Main Content - User Photos */}
                <div className="home-main-content">
                    {selectedUser ? (
                        <div className="photos-container">
                            {/* Header thông tin user được chọn */}
                            <div className="selected-user-header">
                                <h2 className="selected-user-title">
                                    Ảnh của người dùng
                                </h2>
                                <button 
                                    className="close-photos-btn"
                                    onClick={() => setSelectedUser(null)}
                                    title="Đóng xem ảnh"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Component hiển thị photos của user */}
                            <UserPhotos 
                                userId={selectedUser}
                                onError={handleError}
                                onLoadingChange={(isLoading) => handleLoadingChange('userPhotos', isLoading)}
                                currentUser={currentUser}
                            />
                            
                            {/* Loading Overlay cho User Photos */}
                            {loading.userPhotos && (
                                <div className="loading-overlay">
                                    <div className="loading-spinner"></div>
                                    <p>Đang tải ảnh...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Empty State - Chưa chọn user nào */
                        <div className="empty-state">
                            <div className="empty-state-content">
                                <div className="empty-icon">👥</div>
                                <h2 className="empty-title">Chào mừng đến với Photo Share</h2>
                                <p className="empty-description">
                                    Chọn một người dùng từ danh sách bên trái để xem ảnh của họ
                                </p>
                                
                                {/* Quick Actions */}
                                <div className="quick-actions">
                                    <button 
                                        className="quick-action-btn primary"
                                        onClick={handleGoToProfile}
                                    >
                                        📷 Xem trang cá nhân
                                    </button>
                                    
                                    {/* Hiển thị button mở sidebar trên mobile */}
                                    {isMobile() && isSidebarCollapsed && (
                                        <button 
                                            className="quick-action-btn secondary"
                                            onClick={toggleSidebar}
                                        >
                                            👥 Xem danh sách người dùng
                                        </button>
                                    )}
                                </div>

                                {/* Welcome Statistics */}
                                <div className="welcome-stats">
                                    <div className="welcome-stat-item">
                                        <div className="stat-icon">👤</div>
                                        <div className="stat-content">
                                            <span className="stat-label">Tài khoản</span>
                                            <span className="stat-value">{currentUser.first_name} {currentUser.last_name}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="welcome-stat-item">
                                        <div className="stat-icon">📍</div>
                                        <div className="stat-content">
                                            <span className="stat-label">Địa chỉ</span>
                                            <span className="stat-value">{currentUser.location}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="welcome-stat-item">
                                        <div className="stat-icon">💼</div>
                                        <div className="stat-content">
                                            <span className="stat-label">Nghề nghiệp</span>
                                            <span className="stat-value">{currentUser.occupation}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {!isSidebarCollapsed && isMobile() && (
                <div 
                    className="sidebar-overlay"
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Floating Action Button trên mobile */}
            {isMobile() && selectedUser && (
                <button 
                    className="fab-toggle-sidebar"
                    onClick={toggleSidebar}
                    title="Mở danh sách người dùng"
                >
                    👥
                </button>
            )}
        </div>
    );
};

export default Home;