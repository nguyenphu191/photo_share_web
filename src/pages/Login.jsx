import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    // State quản lý form data với controlled components
    const [formData, setFormData] = useState({
        loginName: '',
        password: ''
    });
    
    // State quản lý hiển thị/ẩn mật khẩu
    const [showPassword, setShowPassword] = useState(false);
    
    // State quản lý loading khi submit form
    const [isLoading, setIsLoading] = useState(false);
    
    // State quản lý thông báo (success/error)
    const [message, setMessage] = useState({
        type: '', // 'success', 'error', hoặc ''
        text: ''
    });
    
    // State quản lý validation errors cho từng field
    const [fieldErrors, setFieldErrors] = useState({
        loginName: '',
        password: ''
    });

    // Hook điều hướng trang
    const navigate = useNavigate();

    // Kiểm tra nếu user đã đăng nhập thì chuyển thẳng về profile
    useEffect(() => {
        const checkExistingLogin = () => {
            try {
                const userString = localStorage.getItem('user');
                const token = localStorage.getItem('token');
                if (userString && token) {
                    const user = JSON.parse(userString);
                    if (user && user._id) {
                        navigate('/profile', { replace: true });
                    }
                }
            } catch (error) {
                // Nếu có lỗi parse thì clear localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        };

        checkExistingLogin();
    }, [navigate]);

    // Clear message sau 5 giây
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [message.text]);

    // Validate username field
    const validateLoginName = useCallback((value) => {
        if (!value.trim()) {
            return 'Tên đăng nhập không được để trống';
        }
        if (value.length < 3) {
            return 'Tên đăng nhập phải có ít nhất 3 ký tự';
        }
        if (value.length > 50) {
            return 'Tên đăng nhập không được quá 50 ký tự';
        }
        // Kiểm tra ký tự đặc biệt
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
        }
        return '';
    }, []);

    // Validate password field
    const validatePassword = useCallback((value) => {
        if (!value) {
            return 'Mật khẩu không được để trống';
        }
        if (value.length < 6) {
            return 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        if (value.length > 100) {
            return 'Mật khẩu không được quá 100 ký tự';
        }
        return '';
    }, []);

    // Validate toàn bộ form
    const validateForm = useCallback(() => {
        const loginNameError = validateLoginName(formData.loginName);
        const passwordError = validatePassword(formData.password);
        
        const errors = {
            loginName: loginNameError,
            password: passwordError
        };
        
        setFieldErrors(errors);
        
        // Return true nếu không có lỗi nào
        return !loginNameError && !passwordError;
    }, [formData, validateLoginName, validatePassword]);

    // Xử lý thay đổi input với real-time validation
    const handleInputChange = useCallback((field, value) => {
        // Cập nhật form data
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear general message khi user bắt đầu nhập
        if (message.type === 'error') {
            setMessage({ type: '', text: '' });
        }

        // Validate field real-time (chỉ khi user đã blur khỏi field)
        let error = '';
        if (field === 'loginName') {
            error = validateLoginName(value);
        } else if (field === 'password') {
            error = validatePassword(value);
        }
        
        setFieldErrors(prev => ({
            ...prev,
            [field]: error
        }));
    }, [message.type, validateLoginName, validatePassword]);

    // Xử lý blur input (validate khi user rời khỏi field)
    const handleInputBlur = useCallback((field) => {
        const value = formData[field];
        let error = '';
        
        if (field === 'loginName') {
            error = validateLoginName(value);
        } else if (field === 'password') {
            error = validatePassword(value);
        }
        
        setFieldErrors(prev => ({
            ...prev,
            [field]: error
        }));
    }, [formData, validateLoginName, validatePassword]);

    // Toggle hiển thị/ẩn mật khẩu
    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    // Gọi API đăng nhập
    const loginAPI = useCallback(async (credentials) => {
        try {
            const response = await axios.post(
                'http://localhost:8000/api/admin/login',
                {
                    login_name: credentials.loginName,
                    password: credentials.password
                },
                {
                    timeout: 10000, // Timeout 10 giây
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            // Xử lý các loại lỗi khác nhau
            if (error.response) {
                // Lỗi từ server (4xx, 5xx)
                const status = error.response.status;
                const message = error.response.data?.message || 'Đăng nhập thất bại';
                
                if (status === 401 || status === 400) {
                    throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
                } else if (status === 429) {
                    throw new Error('Quá nhiều lần thử. Vui lòng thử lại sau');
                } else if (status >= 500) {
                    throw new Error('Lỗi máy chủ. Vui lòng thử lại sau');
                } else {
                    throw new Error(message);
                }
            } else if (error.request) {
                // Lỗi network
                throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng');
            } else {
                // Lỗi khác
                throw new Error('Đã xảy ra lỗi không xác định');
            }
        }
    }, []);

    // Xử lý submit form đăng nhập
    const handleSubmit = useCallback(async (e) => {
        // Ngăn default form submission nếu có event
        if (e) {
            e.preventDefault();
        }

        // Validate form trước khi submit
        const isValidForm = validateForm();
        if (!isValidForm) {
            setMessage({
                type: 'error',
                text: 'Vui lòng kiểm tra lại thông tin đã nhập'
            });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Gọi API đăng nhập
            const response = await loginAPI(formData);
            
            // Kiểm tra response có user data và token không
            if (!response.user || !response.token) {
                throw new Error('Phản hồi từ máy chủ không hợp lệ');
            }

            // Lưu thông tin user và token vào localStorage
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);
            
            // Hiển thị thông báo thành công
            setMessage({
                type: 'success',
                text: 'Đăng nhập thành công! Đang chuyển trang...'
            });

            // Chờ 1.5 giây rồi chuyển trang
            setTimeout(() => {
                navigate('/profile', { replace: true });
            }, 1500);

        } catch (error) {
            console.error('Lỗi đăng nhập:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Đăng nhập thất bại. Vui lòng thử lại'
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateForm, loginAPI, navigate]);

    // Xử lý nhấn Enter trong input
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSubmit();
        }
    }, [handleSubmit, isLoading]);

    // Kiểm tra form có hợp lệ để enable/disable submit button
    const isFormValid = useCallback(() => {
        return formData.loginName.trim() && 
               formData.password && 
               !fieldErrors.loginName && 
               !fieldErrors.password;
    }, [formData, fieldErrors]);

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="bg-shape bg-shape-1"></div>
                <div className="bg-shape bg-shape-2"></div>
                <div className="bg-shape bg-shape-3"></div>
            </div>

            {/* Login Container */}
            <div className="login-container">
                <div className="login-card">
                    {/* Header */}
                    <div className="login-header">
                        <div className="login-logo">
                            <div className="logo-icon">👤</div>
                        </div>
                        <h1 className="login-title">Chào mừng trở lại</h1>
                        <p className="login-subtitle">Đăng nhập vào tài khoản của bạn</p>
                    </div>

                    {/* Alert Message */}
                    {message.text && (
                        <div className={`message-alert ${message.type}`}>
                            <div className="message-icon">
                                {message.type === 'success' ? '✅' : '❌'}
                            </div>
                            <span className="message-text">{message.text}</span>
                            <button 
                                className="message-close"
                                onClick={() => setMessage({ type: '', text: '' })}
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* Login Form */}
                    <div className="login-form">
                        {/* Username Field */}
                        <div className="form-group">
                            <label className="form-label">Tên đăng nhập</label>
                            <div className={`input-container ${fieldErrors.loginName ? 'error' : ''}`}>
                                <div className="input-icon">👤</div>
                                <input
                                    type="text"
                                    value={formData.loginName}
                                    onChange={(e) => handleInputChange('loginName', e.target.value)}
                                    onBlur={() => handleInputBlur('loginName')}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập tên đăng nhập"
                                    disabled={isLoading}
                                    className="form-input"
                                    autoComplete="username"
                                />
                            </div>
                            {fieldErrors.loginName && (
                                <div className="field-error">{fieldErrors.loginName}</div>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="form-group">
                            <label className="form-label">Mật khẩu</label>
                            <div className={`input-container ${fieldErrors.password ? 'error' : ''}`}>
                                <div className="input-icon">🔒</div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    onBlur={() => handleInputBlur('password')}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập mật khẩu"
                                    disabled={isLoading}
                                    className="form-input"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    disabled={isLoading}
                                    className="password-toggle"
                                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <div className="field-error">{fieldErrors.password}</div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!isFormValid() || isLoading}
                            className={`submit-btn ${(!isFormValid() || isLoading) ? 'disabled' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Đang đăng nhập...</span>
                                </>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </div>

                    {/* Footer Links */}
                    <div className="login-footer">
                        <p className="footer-text">
                            Chưa có tài khoản?{' '}
                            <button 
                                className="footer-link"
                                onClick={() => navigate('/register')}
                                disabled={isLoading}
                            >
                                Đăng ký ngay
                            </button>
                        </p>
                        
                        {/* Demo Info (có thể xóa trong production) */}
                        <div className="demo-info">
                            <p className="demo-title">Tài khoản demo:</p>
                            <div className="demo-credentials">
                                <p>Username: <code>demo</code></p>
                                <p>Password: <code>123456</code></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;