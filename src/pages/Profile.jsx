import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Comment from '../components/Comment';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    // State lưu thông tin user từ server (có thể khác với localStorage)
    const [user, setUser] = useState(null);
    
    // State lưu danh sách photos của user
    const [photoList, setPhotoList] = useState([]);
    
    // State quản lý loading cho từng action riêng biệt
    const [loading, setLoading] = useState({
        user: true,      // Loading khi fetch user data
        photos: true,    // Loading khi fetch photos
        upload: false,   // Loading khi upload photo
        delete: null,    // Loading khi delete photo (lưu photoId đang delete)
        avatar: false    // Loading khi upload avatar
    });
    
    // State quản lý lỗi
    const [error, setError] = useState('');
    
    // State quản lý file upload cho photos
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    
    // State quản lý file upload cho avatar
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
    
    // State quản lý comments cho từng photo (object với key là photoId)
    const [newComments, setNewComments] = useState({});
    
    // Hook điều hướng trang
    const navigate = useNavigate();

    // Lấy thông tin user đã login từ localStorage với error handling
    const getUserFromStorage = useCallback(() => {
        try {
            const userString = localStorage.getItem('user');
            if (!userString) {
                navigate('/login'); // Chuyển về login nếu chưa đăng nhập
                return null;
            }
            return JSON.parse(userString);
        } catch (error) {
            console.error('Lỗi khi parse user từ localStorage:', error);
            setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
            navigate('/login');
            return null;
        }
    }, [navigate]);

    // Lấy user data một lần khi component mount
    const userLogin = getUserFromStorage();

    // Hàm fetch thông tin user từ server
    const fetchUserData = useCallback(async () => {
        if (!userLogin?._id) return;
        
        try {
            setLoading(prev => ({ ...prev, user: true }));
            setError(''); // Clear error cũ
            
            const response = await axios.get(`http://localhost:8000/api/user/${userLogin._id}`);
            setUser(response.data);
            
            // Cập nhật user trong localStorage với thông tin mới từ server
            localStorage.setItem('user', JSON.stringify(response.data));
            
        } catch (error) {
            console.error('Lỗi khi fetch user data:', error);
            setError('Không thể tải thông tin người dùng. Vui lòng thử lại.');
        } finally {
            setLoading(prev => ({ ...prev, user: false }));
        }
    }, [userLogin?._id]);

    // Hàm fetch danh sách photos của user
    const fetchPhotos = useCallback(async () => {
        if (!userLogin?._id) return;
        
        try {
            setLoading(prev => ({ ...prev, photos: true }));
            
            const response = await axios.get(`http://localhost:8000/api/photo/photosOfUser/${userLogin._id}`);
            setPhotoList(response.data || []); // Đảm bảo luôn có array
            
        } catch (error) {
            console.error('Lỗi khi fetch photos:', error);
            if (error.response?.status === 404) {
                setPhotoList([]); // Chưa có ảnh nào
            } else {
                setError('Không thể tải danh sách ảnh. Vui lòng thử lại.');
                setPhotoList([]); // Set empty array nếu lỗi
            }
        } finally {
            setLoading(prev => ({ ...prev, photos: false }));
        }
    }, [userLogin?._id]);

    // Effect để fetch data khi component mount hoặc userLogin thay đổi
    useEffect(() => {
        if (userLogin?._id) {
            fetchUserData();
            fetchPhotos();
        }
    }, [fetchUserData, fetchPhotos, userLogin?._id]);

    // Xử lý khi user chọn avatar file
    const handleAvatarChange = useCallback((event) => {
        const file = event.target.files[0];
        
        // Kiểm tra có file được chọn không
        if (!file) {
            return;
        }

        // Validate file type (chỉ cho phép ảnh)
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh (JPG, PNG, GIF, ...)');
            return;
        }

        // Validate file size (giới hạn 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setError('Kích thước file không được vượt quá 5MB');
            return;
        }

        // Clear error và set file
        setError('');
        setSelectedAvatar(file);
        
        // Tạo preview URL cho ảnh
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreviewUrl(objectUrl);
    }, []);

    // Xử lý upload avatar
    const handleAvatarUpload = useCallback(async () => {
        // Kiểm tra điều kiện upload
        if (!selectedAvatar || !userLogin) {
            setError('Vui lòng chọn ảnh đại diện để upload');
            return;
        }

        try {
            setLoading(prev => ({ ...prev, avatar: true }));
            setError('');

            // Lấy token từ localStorage
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate('/login');
                return;
            }

            // Tạo FormData để gửi file
            const formData = new FormData();
            formData.append('avatar', selectedAvatar);

            // Gửi request upload
            const response = await axios.post(
                'http://localhost:8000/api/user/upload-avatar',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Cập nhật user state với avatar mới
            setUser(prev => ({
                ...prev,
                avatar: response.data.avatar
            }));

            // Cập nhật localStorage
            const updatedUser = { ...userLogin, avatar: response.data.avatar };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Reset form upload
            setSelectedAvatar(null);
            setAvatarPreviewUrl('');
            
            // Clear file input
            const fileInput = document.querySelector('input[name="avatar"]');
            if (fileInput) {
                fileInput.value = '';
            }

        } catch (error) {
            console.error('Lỗi khi upload avatar:', error);
            setError('Không thể cập nhật ảnh đại diện. Vui lòng thử lại.');
        } finally {
            setLoading(prev => ({ ...prev, avatar: false }));
        }
    }, [selectedAvatar, userLogin, navigate]);

    // === PHOTO FILE HANDLING ===
    // Xử lý khi user chọn file photo
    const handleFileChange = useCallback((event) => {
        const file = event.target.files[0];
        
        // Kiểm tra có file được chọn không
        if (!file) {
            return;
        }

        // Validate file type (chỉ cho phép ảnh)
        if (!file.type.startsWith('image/')) {
            setError('Vui lòng chọn file ảnh (JPG, PNG, GIF, ...)');
            return;
        }

        // Validate file size (giới hạn 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setError('Kích thước file không được vượt quá 5MB');
            return;
        }

        // Clear error và set file
        setError('');
        setSelectedFile(file);
        
        // Tạo preview URL cho ảnh
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    }, []);

    // Cleanup preview URL khi component unmount hoặc file thay đổi
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
            }
        };
    }, [previewUrl, avatarPreviewUrl]);

    // Xử lý upload photo
    const handlePhotoUpload = useCallback(async () => {
        // Kiểm tra điều kiện upload
        if (!selectedFile || !userLogin) {
            setError('Vui lòng chọn ảnh để upload');
            return;
        }

        try {
            setLoading(prev => ({ ...prev, upload: true }));
            setError('');

            // Tạo FormData để gửi file
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('user_id', userLogin._id);

            // Gửi request upload
            const response = await axios.post(
                'http://localhost:8000/api/photo/upload',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            // Cập nhật UI ngay lập tức (optimistic update)
            setPhotoList(prevPhotos => [response.data, ...prevPhotos]);
            
            // Reset form upload
            setSelectedFile(null);
            setPreviewUrl('');
            
            // Clear file input
            const fileInput = document.querySelector('input[type="file"]:not([name="avatar"])');
            if (fileInput) {
                fileInput.value = '';
            }

        } catch (error) {
            console.error('Lỗi khi upload photo:', error);
            setError('Không thể upload ảnh. Vui lòng thử lại.');
        } finally {
            setLoading(prev => ({ ...prev, upload: false }));
        }
    }, [selectedFile, userLogin]);

    // Xử lý xóa photo
    const handlePhotoDelete = useCallback(async (photoId) => {
        // Xác nhận với user trước khi xóa
        const isConfirmed = window.confirm('Bạn có chắc chắn muốn xóa ảnh này?');
        if (!isConfirmed) return;

        try {
            setLoading(prev => ({ ...prev, delete: photoId }));
            
            // Gọi API delete
            await axios.delete(`http://localhost:8000/api/photo/delete/${photoId}`);
            
            // Cập nhật UI ngay lập tức (optimistic update)
            setPhotoList(prevPhotos => 
                prevPhotos.filter(photo => photo._id !== photoId)
            );

        } catch (error) {
            console.error('Lỗi khi xóa photo:', error);
            setError('Không thể xóa ảnh. Vui lòng thử lại.');
            
            // Reload photos để đảm bảo data consistency
            fetchPhotos();
        } finally {
            setLoading(prev => ({ ...prev, delete: null }));
        }
    }, [fetchPhotos]);

    // Xử lý thay đổi nội dung comment
    const handleCommentChange = useCallback((event, photoId) => {
        const { value } = event.target;
        
        // Cập nhật comment text cho photo cụ thể
        setNewComments(prevState => ({
            ...prevState,
            [photoId]: value
        }));
    }, []);

    // Xử lý post comment mới
    const handleCommentPost = useCallback(async (photoId) => {
        const commentText = newComments[photoId]?.trim();
        
        // Kiểm tra điều kiện post comment
        if (!commentText || !userLogin) {
            return;
        }

        try {
            // Tạo object comment mới
            const newComment = {
                comment: commentText,
                userId: userLogin._id
            };

            // Gọi API post comment
            const response = await axios.post(
                `http://localhost:8000/api/photo/commentsOfPhoto/${photoId}`,
                newComment
            );

            // Cập nhật UI ngay lập tức (optimistic update)
            setPhotoList(prevPhotos => 
                prevPhotos.map(photo => {
                    if (photo._id === photoId) {
                        return {
                            ...photo,
                            comments: [...(photo.comments || []), {
                                _id: Date.now().toString(), // Temporary ID
                                comment: commentText,
                                date_time: new Date().toISOString(),
                                user_id: userLogin._id,
                                user: {
                                    _id: userLogin._id,
                                    first_name: userLogin.first_name,
                                    last_name: userLogin.last_name
                                }
                            }]
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
            setError('Không thể đăng comment. Vui lòng thử lại.');
        }
    }, [newComments, userLogin]);

    // Format datetime cho hiển thị
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

    // Tạo avatar URL cho user
    const getUserAvatarUrl = useCallback((user) => {
        if (user?.avatar) {
            return `http://localhost:8000${user.avatar}`;
        }
        if (!user?.last_name) {
            return '/images/default.jpg';
        }
        return `/images/${user.last_name.toLowerCase()}.jpg`;
    }, []);

    // Hiển thị loading nếu chưa có user login
    if (!userLogin) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin người dùng...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Error Banner */}
            {error && (
                <div className="error-banner">
                    <span className="error-message">{error}</span>
                    <button 
                        className="error-dismiss"
                        onClick={() => setError('')}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="profile-container">
                {/* Profile Sidebar */}
                <div className="profile-sidebar">
                    <div className="profile-card">
                        {/* User Info Section */}
                        <div className="user-info-section">
                            <h2 className="page-title">Trang cá nhân</h2>
                            
                            <div className="user-profile">
                                <div className="avatar-container">
                                    <img 
                                        src={getUserAvatarUrl(user || userLogin)}
                                        alt="Avatar"
                                        className="user-avatar"
                                    />
                                    
                                    {/* Avatar Upload Controls */}
                                    <div className="avatar-upload-controls">
                                        <label className="avatar-upload-label">
                                            <input
                                                type="file"
                                                name="avatar"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="avatar-input-hidden"
                                            />
                                            <div className="avatar-upload-btn">
                                                📷 Đổi ảnh đại diện
                                            </div>
                                        </label>
                                        
                                        {/* Avatar Preview */}
                                        {avatarPreviewUrl && (
                                            <div className="avatar-preview-container">
                                                <img 
                                                    src={avatarPreviewUrl}
                                                    alt="Preview"
                                                    className="avatar-preview"
                                                />
                                                <button
                                                    onClick={handleAvatarUpload}
                                                    disabled={!selectedAvatar || loading.avatar}
                                                    className={`avatar-save-btn ${(!selectedAvatar || loading.avatar) ? 'disabled' : ''}`}
                                                >
                                                    {loading.avatar ? (
                                                        <>
                                                            <div className="spinner"></div>
                                                            Đang lưu...
                                                        </>
                                                    ) : (
                                                        'Lưu ảnh đại diện'
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="user-details">
                                    <div className="user-field">
                                        <label>Tên:</label>
                                        <span>{(user || userLogin).first_name}</span>
                                    </div>
                                    <div className="user-field">
                                        <label>Họ:</label>
                                        <span>{(user || userLogin).last_name}</span>
                                    </div>
                                    <div className="user-field">
                                        <label>Địa chỉ:</label>
                                        <span>{(user || userLogin).location}</span>
                                    </div>
                                    <div className="user-field">
                                        <label>Nghề nghiệp:</label>
                                        <span>{(user || userLogin).occupation}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Upload Section */}
                        <div className="upload-section">
                            <h3 className="section-title">Chia sẻ ảnh mới</h3>
                            
                            {/* File Input */}
                            <div className="file-input-container">
                                <label className="file-input-label">
                                    <input 
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="file-input-hidden"
                                    />
                                    <div className="file-input-display">
                                        <div className="file-input-icon">📁</div>
                                        <p>Chọn ảnh để upload</p>
                                        <small>Tối đa 5MB</small>
                                    </div>
                                </label>
                            </div>

                            {/* Preview Image */}
                            {previewUrl && (
                                <div className="preview-container">
                                    <img 
                                        src={previewUrl}
                                        alt="Preview"
                                        className="preview-image"
                                    />
                                </div>
                            )}

                            {/* Upload Button */}
                            <button
                                onClick={handlePhotoUpload}
                                disabled={!selectedFile || loading.upload}
                                className={`upload-btn ${(!selectedFile || loading.upload) ? 'disabled' : ''}`}
                            >
                                {loading.upload ? (
                                    <>
                                        <div className="spinner"></div>
                                        Đang upload...
                                    </>
                                ) : (
                                    'Chia sẻ ảnh'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Photos Feed */}
                <div className="photos-feed">
                    <h2 className="feed-title">Ảnh của tôi</h2>
                    
                    {/* Loading State */}
                    {loading.photos ? (
                        <div className="photos-loading">
                            <div className="loading-spinner"></div>
                            <p>Đang tải ảnh...</p>
                        </div>
                    ) : photoList.length === 0 ? (
                        /* Empty State */
                        <div className="empty-state">
                            <div className="empty-icon">📷</div>
                            <h3>Chưa có ảnh nào</h3>
                            <p>Hãy chia sẻ ảnh đầu tiên của bạn!</p>
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
                                                src={getUserAvatarUrl(user || userLogin)}
                                                alt="User avatar"
                                                className="photo-user-avatar"
                                            />
                                            <div className="photo-user-details">
                                                <span className="photo-user-name">
                                                    {(user || userLogin).first_name}
                                                </span>
                                                <span className="photo-date">
                                                    {formatDateTime(photo.date_time)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => handlePhotoDelete(photo._id)}
                                            disabled={loading.delete === photo._id}
                                            className="delete-btn"
                                            title="Xóa ảnh"
                                        >
                                            {loading.delete === photo._id ? (
                                                <div className="spinner-small"></div>
                                            ) : (
                                                '🗑️'
                                            )}
                                        </button>
                                    </div>

                                    {/* Photo Image */}
                                    <img 
                                        src={`http://localhost:8000${photo.file_name}`}
                                        alt="User photo"
                                        className="photo-image"
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

                                        {/* Add Comment */}
                                        <div className="add-comment">
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
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;