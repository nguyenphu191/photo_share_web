import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import Comment from './Comment';
import ReactionPicker from './ReactionPicker';
import ReactionDisplay from './ReactionDisplay';
import ReactionDetailsModal from './ReactionDetailsModal';
import useReactions from '../hooks/useReactions';

const UserPhotos = ({ userId, onError, onLoadingChange, currentUser }) => {
    // State lưu thông tin user được chọn
    const [selectedUser, setSelectedUser] = useState(null);
    
    // State lưu danh sách photos của user được chọn
    const [photoList, setPhotoList] = useState([]);
    
    // State quản lý loading
    const [loading, setLoading] = useState({
        user: false,
        photos: false
    });
    
    // State quản lý comments cho từng photo
    const [newComments, setNewComments] = useState({});
    
    // State quản lý modal xem chi tiết reactions
    const [reactionModal, setReactionModal] = useState({
        isOpen: false,
        photoId: null,
        stats: {}
    });

    // ⭐ QUAN TRỌNG: Sử dụng ref để tránh infinite loop
    const currentUserIdRef = useRef(null);
    const loadingTimeoutRef = useRef(null);

    // ⭐ Memoized callbacks để tránh re-create function mỗi lần render
    const handleError = useCallback((errorMessage) => {
        console.error('UserPhotos Error:', errorMessage);
        if (onError && typeof onError === 'function') {
            onError(errorMessage);
        }
    }, [onError]);

    const handleLoadingChange = useCallback((isLoading) => {
        if (onLoadingChange && typeof onLoadingChange === 'function') {
            onLoadingChange(isLoading);
        }
    }, [onLoadingChange]);

    // Hàm fetch thông tin user được chọn
    const fetchSelectedUser = useCallback(async (targetUserId) => {
        if (!targetUserId) return null;
        
        try {
            console.log('🔍 Fetching user data for ID:', targetUserId);
            setLoading(prev => ({ ...prev, user: true }));
            
            const response = await axios.get(`http://localhost:8000/api/user/${targetUserId}`, {
                timeout: 10000
            });
            
            if (response.data) {
                console.log('✅ User data fetched successfully:', response.data.first_name);
                setSelectedUser(response.data);
                return response.data;
            } else {
                throw new Error('No user data received');
            }
            
        } catch (error) {
            console.error('❌ Error fetching user data:', error);
            let errorMessage = 'Không thể tải thông tin người dùng';
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Timeout: Không thể kết nối tới server';
            } else if (error.response?.status === 404) {
                errorMessage = 'Không tìm thấy người dùng';
            } else if (error.response?.status === 500) {
                errorMessage = 'Lỗi server khi tải thông tin người dùng';
            }
            
            handleError(errorMessage);
            setSelectedUser(null);
            return null;
        } finally {
            setLoading(prev => ({ ...prev, user: false }));
        }
    }, [handleError]);

    // Hàm fetch danh sách photos của user được chọn
    const fetchPhotos = useCallback(async (targetUserId) => {
        if (!targetUserId) return [];
        
        try {
            console.log('📷 Fetching photos for user ID:', targetUserId);
            setLoading(prev => ({ ...prev, photos: true }));
            
            const response = await axios.get(`http://localhost:8000/api/photo/photosOfUser/${targetUserId}`, {
                timeout: 15000
            });
            
            console.log('📷 Photos API response status:', response.status);
            console.log('📷 Photos data length:', response.data?.length || 0);
            
            const photosData = Array.isArray(response.data) ? response.data : [];
            setPhotoList(photosData);
            console.log(`✅ Successfully loaded ${photosData.length} photos`);
            return photosData;
            
        } catch (error) {
            console.error('❌ Error fetching photos:', error);
            
            if (error.response?.status === 404) {
                console.log('ℹ️ User has no photos - this is normal');
                setPhotoList([]);
                return [];
            } else {
                let errorMessage = 'Không thể tải danh sách ảnh';
                
                if (error.code === 'ECONNABORTED') {
                    errorMessage = 'Timeout: Không thể tải ảnh';
                } else if (error.response?.status === 500) {
                    errorMessage = 'Lỗi server khi tải ảnh';
                }
                
                handleError(errorMessage);
                setPhotoList([]);
                return [];
            }
        } finally {
            setLoading(prev => ({ ...prev, photos: false }));
        }
    }, [handleError]);

    // ⭐ FIXED: Effect chính - chỉ chạy khi userId thay đổi thực sự
    useEffect(() => {
        // ⭐ Kiểm tra userId có thay đổi thực sự không
        if (currentUserIdRef.current === userId) {
            console.log('👍 UserId unchanged, skipping fetch');
            return;
        }

        // Clear timeout cũ nếu có
        if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
        }

        // Update ref
        currentUserIdRef.current = userId;

        if (userId) {
            console.log('🚀 UserPhotos useEffect triggered with NEW userId:', userId);
            
            // Reset states
            setSelectedUser(null);
            setPhotoList([]);
            setNewComments({});
            
            // Notify parent về loading state
            handleLoadingChange(true);
            
            // Fetch data tuần tự
            const fetchData = async () => {
                try {
                    await fetchSelectedUser(userId);
                    await fetchPhotos(userId);
                } catch (error) {
                    console.error('❌ Error in fetchData:', error);
                } finally {
                    handleLoadingChange(false);
                }
            };
            
            fetchData();

            // ⭐ Safety timeout để tránh loading vô hạn
            loadingTimeoutRef.current = setTimeout(() => {
                console.warn('⚠️ Loading timeout reached');
                setLoading({ user: false, photos: false });
                handleLoadingChange(false);
            }, 30000); // 30 seconds timeout

        } else {
            // Reset tất cả khi không có userId
            console.log('🔄 No userId, resetting states');
            setSelectedUser(null);
            setPhotoList([]);
            setNewComments({});
            setLoading({ user: false, photos: false });
            handleLoadingChange(false);
        }

        // Cleanup function
        return () => {
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
            }
        };
    }, [userId]); // ⭐ CHỈ depend vào userId

    // Cleanup khi component unmount
    useEffect(() => {
        return () => {
            console.log('🧹 UserPhotos component unmounting, cleaning up...');
            if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
            }
            setSelectedUser(null);
            setPhotoList([]);
            setNewComments({});
        };
    }, []);

    // ⭐ Memoized comment handlers
    const handleCommentChange = useCallback((event, photoId) => {
        if (!event || !photoId) return;
        const { value } = event.target;
        setNewComments(prevState => ({
            ...prevState,
            [photoId]: value
        }));
    }, []);

    const handleCommentPost = useCallback(async (photoId) => {
        if (!photoId || !currentUser) {
            console.warn('Missing photoId or currentUser for comment post');
            return;
        }
        
        const commentText = newComments[photoId]?.trim();
        if (!commentText) {
            console.warn('Empty comment text');
            return;
        }

        try {
            console.log('💬 Posting comment for photo:', photoId);
            
            const newComment = {
                comment: commentText,
                userId: currentUser._id
            };

            const response = await axios.post(
                `http://localhost:8000/api/photo/commentsOfPhoto/${photoId}`,
                newComment,
                {
                    timeout: 10000,
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            console.log('✅ Comment posted successfully');

            // Cập nhật UI với comment mới
            setPhotoList(prevPhotos => 
                prevPhotos.map(photo => {
                    if (photo._id === photoId) {
                        const updatedComments = [...(photo.comments || []), response.data];
                        return { ...photo, comments: updatedComments };
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
            console.error('❌ Error posting comment:', error);
            handleError('Không thể đăng comment');
        }
    }, [newComments, currentUser, handleError]);

    // ⭐ NEW: Reaction handlers
    const handleReactionChange = useCallback((photoId, { action, reactionType, oldReactionType, stats }) => {
        console.log('🎭 Reaction changed:', { photoId, action, reactionType, stats });
        
        // Cập nhật photoList với stats mới
        setPhotoList(prevPhotos => 
            prevPhotos.map(photo => {
                if (photo._id === photoId) {
                    return {
                        ...photo,
                        reaction_stats: stats
                    };
                }
                return photo;
            })
        );
    }, []);

    const handleViewReactionDetails = useCallback((photoId, reactions, stats) => {
        setReactionModal({
            isOpen: true,
            photoId,
            stats
        });
    }, []);

    const handleCloseReactionModal = useCallback(() => {
        setReactionModal({
            isOpen: false,
            photoId: null,
            stats: {}
        });
    }, []);

    // ⭐ Memoized utility functions
    const formatDateTime = useCallback((dateTimeString) => {
        try {
            if (!dateTimeString) return 'Thời gian không xác định';
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) return 'Thời gian không hợp lệ';
            
            return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Thời gian không xác định';
        }
    }, []);

    const getUserAvatarUrl = useCallback((user) => {
        if (!user) return '/images/default.jpg';
        if (user.avatar) return `http://localhost:8000${user.avatar}`;
        if (user.last_name) return `/images/${user.last_name.toLowerCase()}.jpg`;
        return '/images/default.jpg';
    }, []);

    // ⭐ RENDER - Kiểm tra loading states
    const isLoading = loading.user || loading.photos;
    
    if (isLoading) {
        console.log('📊 Rendering loading state...');
        return (
            <div className="photos-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải ảnh...</p>
            </div>
        );
    }

    if (!selectedUser) {
        console.log('📊 Rendering no user state...');
        return (
            <div className="empty-state">
                <div className="empty-icon">👤</div>
                <h3>Không tìm thấy người dùng</h3>
                <p>Vui lòng thử lại sau</p>
            </div>
        );
    }

    console.log('📊 Rendering main content with', photoList.length, 'photos');

    return (
        <div className="user-photos-container">
            {/* Header thông tin user */}
            <div className="user-photos-header">
                <div className="user-info">
                    <img 
                        src={getUserAvatarUrl(selectedUser)}
                        alt={`Avatar của ${selectedUser.first_name} ${selectedUser.last_name}`}
                        className="user-avatar-large"
                        onError={(e) => {
                            console.warn('Failed to load user avatar, using default');
                            e.target.src = '/images/default.jpg';
                        }}
                    />
                    <div className="user-details">
                        <h3 className="user-name">
                            {selectedUser.first_name} {selectedUser.last_name}
                        </h3>
                        <div className="user-meta">
                            {selectedUser.location && (
                                <span className="user-location">📍 {selectedUser.location}</span>
                            )}
                            {selectedUser.occupation && (
                                <span className="user-occupation">💼 {selectedUser.occupation}</span>
                            )}
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
                <h2 className="feed-title">
                    Ảnh của {selectedUser.first_name}
                </h2>
                
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
                        {photoList.map(photo => {
                            if (!photo || !photo._id) {
                                console.warn('Invalid photo object:', photo);
                                return null;
                            }
                            
                            return (
                                <div key={photo._id} className="photo-card">
                                    {/* Photo Header */}
                                    <div className="photo-header">
                                        <div className="photo-user-info">
                                            <img 
                                                src={getUserAvatarUrl(selectedUser)}
                                                alt={`Avatar của ${selectedUser.first_name}`}
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
                                        alt={`Ảnh của ${selectedUser.first_name}`}
                                        className="photo-image"
                                        onError={(e) => {
                                            console.error('Failed to load image:', photo.file_name);
                                            e.target.src = '/images/default.jpg';
                                            e.target.alt = 'Không thể tải ảnh';
                                        }}
                                    />

                                    {/* ⭐ NEW: Reactions Section */}
                                    <div className="photo-reactions-section">
                                        <div className="photo-reaction-stats">
                                            {photo.reaction_stats?.total > 0 && (
                                                <ReactionDisplay
                                                    reactions={photo.reactions || []}
                                                    reactionStats={photo.reaction_stats || {}}
                                                    onViewDetails={(reactions, stats) => 
                                                        handleViewReactionDetails(photo._id, reactions, stats)
                                                    }
                                                />
                                            )}
                                        </div>
                                        
                                        <div className="photo-reaction-actions">
                                            <ReactionPicker
                                                photoId={photo._id}
                                                currentUser={currentUser}
                                                userReaction={photo.reactions?.find(r => 
                                                    r.user_id === currentUser?._id
                                                )}
                                                onReactionChange={(changeData) => 
                                                    handleReactionChange(photo._id, changeData)
                                                }
                                                disabled={!currentUser}
                                            />
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="comments-section">
                                        <h5 className="comments-title">
                                            Bình luận {photo.comments?.length ? `(${photo.comments.length})` : ''}:
                                        </h5>
                                        
                                        {/* Comments List */}
                                        {photo.comments && photo.comments.length > 0 && (
                                            <div className="comments-list">
                                                {photo.comments.map(comment => {
                                                    if (!comment || !comment._id) {
                                                        console.warn('Invalid comment object:', comment);
                                                        return null;
                                                    }
                                                    
                                                    return (
                                                        <div key={comment._id} className="comment-item">
                                                            <Comment comment={comment} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Add Comment */}
                                        {currentUser && (
                                            <div className="add-comment">
                                                <img 
                                                    src={getUserAvatarUrl(currentUser)}
                                                    alt="Avatar của bạn"
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
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleCommentPost(photo._id);
                                                        }
                                                    }}
                                                    className="comment-input"
                                                    maxLength={500}
                                                />
                                                <button
                                                    onClick={() => handleCommentPost(photo._id)}
                                                    disabled={!newComments[photo._id]?.trim()}
                                                    className={`comment-btn ${!newComments[photo._id]?.trim() ? 'disabled' : ''}`}
                                                    title="Đăng bình luận"
                                                >
                                                    Đăng
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ⭐ NEW: Reaction Details Modal */}
            <ReactionDetailsModal
                photoId={reactionModal.photoId}
                isOpen={reactionModal.isOpen}
                onClose={handleCloseReactionModal}
                initialStats={reactionModal.stats}
            />
        </div>
    );
};

export default UserPhotos;