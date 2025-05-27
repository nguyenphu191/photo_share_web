import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Comment from './Comment';

const UserPhotos = ({ userId, onError, onLoadingChange, currentUser }) => {
    // State lưu thông tin user được chọn
    const [selectedUser, setSelectedUser] = useState(null);
    
    // State lưu danh sách photos của user được chọn
    const [photoList, setPhotoList] = useState([]);
    
    // State quản lý loading
    const [loading, setLoading] = useState({
        user: true,
        photos: true
    });
    
    // State quản lý comments cho từng photo
    const [newComments, setNewComments] = useState({});

    // Hàm fetch thông tin user được chọn
    const fetchSelectedUser = useCallback(async () => {
        if (!userId) return;
        
        try {
            setLoading(prev => ({ ...prev, user: true }));
            onLoadingChange && onLoadingChange(true);
            
            console.log('Fetching user data for ID:', userId);
            const response = await axios.get(`http://localhost:8000/api/user/${userId}`);
            console.log('User data fetched:', response.data);
            
            setSelectedUser(response.data);
            
        } catch (error) {
            console.error('Lỗi khi fetch user data:', error);
            const errorMessage = error.response?.data?.error || 'Không thể tải thông tin người dùng';
            onError && onError(errorMessage);
        } finally {
            setLoading(prev => ({ ...prev, user: false }));
        }
    }, [userId, onError, onLoadingChange]);

    // Hàm fetch danh sách photos của user được chọn
    const fetchPhotos = useCallback(async () => {
        if (!userId) return;
        
        try {
            setLoading(prev => ({ ...prev, photos: true }));
            onLoadingChange && onLoadingChange(true);
            
            console.log('Fetching photos for user ID:', userId);
            const response = await axios.get(`http://localhost:8000/api/photo/photosOfUser/${userId}`);
            console.log('Photos fetched:', response.data);
            
            setPhotoList(response.data || []);
            
        } catch (error) {
            console.error('Lỗi khi fetch photos:', error);
            
            if (error.response?.status === 404) {
                console.log('User has no photos');
                setPhotoList([]);
            } else {
                const errorMessage = error.response?.data?.error || 'Không thể tải danh sách ảnh';
                onError && onError(errorMessage);
                setPhotoList([]);
            }
        } finally {
            setLoading(prev => ({ ...prev, photos: false }));
            onLoadingChange && onLoadingChange(false);
        }
    }, [userId, onError, onLoadingChange]);

    // Effect để fetch data khi userId thay đổi
    useEffect(() => {
        if (userId) {
            fetchSelectedUser();
            fetchPhotos();
        } else {
            setSelectedUser(null);
            setPhotoList([]);
            setLoading({ user: false, photos: false });
            onLoadingChange && onLoadingChange(false);
        }
    }, [userId, fetchSelectedUser, fetchPhotos, onLoadingChange]);

    // Xử lý thay đổi nội dung comment
    const handleCommentChange = useCallback((event, photoId) => {
        const { value } = event.target;
        
        setNewComments(prevState => ({
            ...prevState,
            [photoId]: value
        }));
    }, []);

    // Xử lý post comment mới
    const handleCommentPost = useCallback(async (photoId) => {
        const commentText = newComments[photoId]?.trim();
        
        if (!commentText || !currentUser) {
            return;
        }

        try {
            console.log('Posting comment for photo:', photoId);
            
            const newComment = {
                comment: commentText,
                userId: currentUser._id
            };

            const response = await axios.post(
                `http://localhost:8000/api/photo/commentsOfPhoto/${photoId}`,
                newComment
            );

            console.log('Comment posted:', response.data);

            // Cập nhật UI với comment mới
            setPhotoList(prevPhotos => 
                prevPhotos.map(photo => {
                    if (photo._id === photoId) {
                        return {
                            ...photo,
                            comments: [...(photo.comments || []), response.data]
                        };
                    }
                    return photo;
                })
            );

            // Clear input comment
            setNewComments(prevState => ({
                ...prevState,
                [photoId]: ''
            }));

        } catch (error) {
            console.error('Lỗi khi post comment:', error);
            const errorMessage = error.response?.data?.error || 'Không thể đăng comment';
            onError && onError(errorMessage);
        }
    }, [newComments, currentUser, onError]);

    // Format datetime
    const formatDateTime = useCallback((dateTimeString) => {
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Thời gian không xác định';
        }
    }, []);

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

    // Nếu đang loading
    if (loading.user || loading.photos) {
        return (
            <div className="photos-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải ảnh...</p>
            </div>
        );
    }

    // Nếu không có user được chọn
    if (!selectedUser) {
        return (
            <div className="empty-state">
                <div className="empty-icon">👤</div>
                <h3>Không tìm thấy người dùng</h3>
                <p>Vui lòng thử lại sau</p>
            </div>
        );
    }

    return (
        <div className="user-photos-container">
            {/* Header thông tin user */}
            <div className="user-photos-header">
                <div className="user-info">
                    <img 
                        src={getUserAvatarUrl(selectedUser)}
                        alt="User avatar"
                        className="user-avatar-large"
                        onError={(e) => {
                            e.target.src = '/images/default.jpg';
                        }}
                    />
                    <div className="user-details">
                        <h3 className="user-name">
                            {selectedUser.first_name} {selectedUser.last_name}
                        </h3>
                        <div className="user-meta">
                            <span className="user-location">📍 {selectedUser.location}</span>
                            <span className="user-occupation">💼 {selectedUser.occupation}</span>
                        </div>
                        {selectedUser.description && (
                            <p className="user-description">{selectedUser.description}</p>
                        )}
                    </div>
                </div>
                <div className="photos-count">
                    <span className="count-number">{photoList.length}</span>
                    <span className="count-label">ảnh</span>
                </div>
            </div>

            {/* Photos Content */}
            <div className="photos-content">
                <h2 className="feed-title">Ảnh của {selectedUser.first_name}</h2>
                
                {photoList.length === 0 ? (
                    /* Empty State */
                    <div className="empty-state">
                        <div className="empty-icon">📷</div>
                        <h3>Chưa có ảnh nào</h3>
                        <p>{selectedUser.first_name} chưa chia sẻ ảnh nào</p>
                    </div>
                ) : (
                    /* Photos Grid */
                    <div className="photos-grid">
                        {photoList.map(photo => (
                            <div key={photo._id} className="photo-card">
                                {/* Photo Header */}
                                <div className="photo-header">
                                    <div className="photo-user-info">
                                        <img 
                                            src={getUserAvatarUrl(selectedUser)}
                                            alt="User avatar"
                                            className="photo-user-avatar"
                                            onError={(e) => {
                                                e.target.src = '/images/default.jpg';
                                            }}
                                        />
                                        <div className="photo-user-details">
                                            <span className="photo-user-name">
                                                {selectedUser.first_name} {selectedUser.last_name}
                                            </span>
                                            <span className="photo-date">
                                                {formatDateTime(photo.date_time)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Photo Image */}
                                <img 
                                    src={`http://localhost:8000${photo.file_name}`}
                                    alt="User photo"
                                    className="photo-image"
                                    onError={(e) => {
                                        console.error('Failed to load image:', photo.file_name);
                                        e.target.src = '/images/default.jpg';
                                    }}
                                />

                                {/* Comments Section */}
                                <div className="comments-section">
                                    <h5 className="comments-title">Bình luận:</h5>
                                    
                                    {/* Comments List */}
                                    {photo.comments && photo.comments.length > 0 && (
                                        <div className="comments-list">
                                            {photo.comments.map(comment => (
                                                <div key={comment._id} className="comment-item">
                                                    <Comment comment={comment} />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Comment - Chỉ hiển thị nếu có currentUser */}
                                    {currentUser && (
                                        <div className="add-comment">
                                            <img 
                                                src={getUserAvatarUrl(currentUser)}
                                                alt="Your avatar"
                                                className="comment-input-avatar"
                                                onError={(e) => {
                                                    e.target.src = '/images/default.jpg';
                                                }}
                                            />
                                            <input
                                                type="text"
                                                placeholder="Thêm bình luận..."
                                                value={newComments[photo._id] || ''}
                                                onChange={(e) => handleCommentChange(e, photo._id)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleCommentPost(photo._id);
                                                    }
                                                }}
                                                className="comment-input"
                                            />
                                            <button
                                                onClick={() => handleCommentPost(photo._id)}
                                                disabled={!newComments[photo._id]?.trim()}
                                                className={`comment-btn ${!newComments[photo._id]?.trim() ? 'disabled' : ''}`}
                                            >
                                                Đăng
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserPhotos;