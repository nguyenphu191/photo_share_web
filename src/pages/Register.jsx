import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    // === KHAI BÁO STATE ===
    // State quản lý form data với controlled components
    const [formData, setFormData] = useState({
        loginName: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: '',
        location: '',
        description: '',
        occupation: ''
    });
    
    // State quản lý hiển thị/ẩn mật khẩu
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // State quản lý loading khi submit form
    const [isLoading, setIsLoading] = useState(false);
    
    // State quản lý thông báo (success/error)
    const [message, setMessage] = useState({
        type: '', // 'success', 'error', hoặc ''
        text: ''
    });
    
    // State quản lý validation errors cho từng field
    const [fieldErrors, setFieldErrors] = useState({});
    
    // State theo dõi fields nào đã được user tương tác (để hiển thị validation)
    const [touchedFields, setTouchedFields] = useState({});

    // Hook điều hướng trang
    const navigate = useNavigate();

    // === EFFECT HOOKS ===
    // Kiểm tra nếu user đã đăng nhập thì chuyển thẳng về profile
    useEffect(() => {
        const checkExistingLogin = () => {
            try {
                const userString = localStorage.getItem('user');
                if (userString) {
                    const user = JSON.parse(userString);
                    if (user && user._id) {
                        navigate('/profile', { replace: true });
                    }
                }
            } catch (error) {
                // Nếu có lỗi parse thì clear localStorage
                localStorage.removeItem('user');
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

    // === VALIDATION FUNCTIONS ===
    // Validate login name
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
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới';
        }
        return '';
    }, []);

    // Validate first name
    const validateFirstName = useCallback((value) => {
        if (!value.trim()) {
            return 'Tên không được để trống';
        }
        if (value.length < 2) {
            return 'Tên phải có ít nhất 2 ký tự';
        }
        if (value.length > 50) {
            return 'Tên không được quá 50 ký tự';
        }
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) {
            return 'Tên chỉ được chứa chữ cái và khoảng trắng';
        }
        return '';
    }, []);

    // Validate last name
    const validateLastName = useCallback((value) => {
        if (!value.trim()) {
            return 'Họ không được để trống';
        }
        if (value.length < 2) {
            return 'Họ phải có ít nhất 2 ký tự';
        }
        if (value.length > 50) {
            return 'Họ không được quá 50 ký tự';
        }
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) {
            return 'Họ chỉ được chứa chữ cái và khoảng trắng';
        }
        return '';
    }, []);

    // Validate password
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
        // Kiểm tra mật khẩu mạnh (ít nhất 1 chữ cái và 1 số)
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
            return 'Mật khẩu phải có ít nhất 1 chữ cái và 1 số';
        }
        return '';
    }, []);

    // Validate confirm password
    const validateConfirmPassword = useCallback((value, password) => {
        if (!value) {
            return 'Vui lòng xác nhận mật khẩu';
        }
        if (value !== password) {
            return 'Mật khẩu xác nhận không khớp';
        }
        return '';
    }, []);

    // Validate location
    const validateLocation = useCallback((value) => {
        if (!value.trim()) {
            return 'Địa chỉ không được để trống';
        }
        if (value.length < 5) {
            return 'Địa chỉ phải có ít nhất 5 ký tự';
        }
        if (value.length > 200) {
            return 'Địa chỉ không được quá 200 ký tự';
        }
        return '';
    }, []);

    // Validate occupation
    const validateOccupation = useCallback((value) => {
        if (!value.trim()) {
            return 'Nghề nghiệp không được để trống';
        }
        if (value.length < 2) {
            return 'Nghề nghiệp phải có ít nhất 2 ký tự';
        }
        if (value.length > 100) {
            return 'Nghề nghiệp không được quá 100 ký tự';
        }
        return '';
    }, []);

    // Validate description (optional field)
    const validateDescription = useCallback((value) => {
        if (value && value.length > 500) {
            return 'Mô tả không được quá 500 ký tự';
        }
        return '';
    }, []);

    // Validate single field dựa trên field name
    const validateField = useCallback((fieldName, value) => {
        switch (fieldName) {
            case 'loginName':
                return validateLoginName(value);
            case 'firstName':
                return validateFirstName(value);
            case 'lastName':
                return validateLastName(value);
            case 'password':
                return validatePassword(value);
            case 'confirmPassword':
                return validateConfirmPassword(value, formData.password);
            case 'location':
                return validateLocation(value);
            case 'occupation':
                return validateOccupation(value);
            case 'description':
                return validateDescription(value);
            default:
                return '';
        }
    }, [formData.password, validateLoginName, validateFirstName, validateLastName, 
        validatePassword, validateConfirmPassword, validateLocation, 
        validateOccupation, validateDescription]);

    // Validate toàn bộ form
    const validateForm = useCallback(() => {
        const errors = {};
        
        // Validate tất cả required fields
        const requiredFields = ['loginName', 'firstName', 'lastName', 'password', 'confirmPassword', 'location', 'occupation'];
        
        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                errors[field] = error;
            }
        });

        // Validate optional description field
        const descError = validateDescription(formData.description);
        if (descError) {
            errors.description = descError;
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, validateField, validateDescription]);

    // === EVENT HANDLERS ===
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

        // Validate field real-time chỉ khi field đã được touched
        if (touchedFields[field]) {
            const error = validateField(field, value);
            setFieldErrors(prev => ({
                ...prev,
                [field]: error
            }));
        }

        // Đặc biệt validate confirmPassword khi password thay đổi
        if (field === 'password' && touchedFields.confirmPassword) {
            const confirmError = validateConfirmPassword(formData.confirmPassword, value);
            setFieldErrors(prev => ({
                ...prev,
                confirmPassword: confirmError
            }));
        }
    }, [message.type, touchedFields, validateField, validateConfirmPassword, formData.confirmPassword]);

    // Xử lý blur input (đánh dấu field đã được touched và validate)
    const handleInputBlur = useCallback((field) => {
        // Đánh dấu field đã được touched
        setTouchedFields(prev => ({
            ...prev,
            [field]: true
        }));

        // Validate field
        const value = formData[field];
        const error = validateField(field, value);
        
        setFieldErrors(prev => ({
            ...prev,
            [field]: error
        }));
    }, [formData, validateField]);

    // Toggle hiển thị/ẩn mật khẩu
    const togglePasswordVisibility = useCallback((field) => {
        if (field === 'password') {
            setShowPassword(prev => !prev);
        } else if (field === 'confirmPassword') {
            setShowConfirmPassword(prev => !prev);
        }
    }, []);

    // === API FUNCTIONS ===
    // Gọi API đăng ký
    const registerAPI = useCallback(async (userData) => {
        try {
            const response = await axios.post(
                'http://localhost:8000/api/admin/register',
                {
                    login_name: userData.loginName,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    password: userData.password,
                    location: userData.location,
                    description: userData.description,
                    occupation: userData.occupation
                },
                {
                    timeout: 15000, // Timeout 15 giây cho đăng ký
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            // Xử lý các loại lỗi khác nhau
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Đăng ký thất bại';
                
                if (status === 409) {
                    throw new Error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác');
                } else if (status === 400) {
                    throw new Error(message || 'Dữ liệu không hợp lệ');
                } else if (status === 429) {
                    throw new Error('Quá nhiều lần thử. Vui lòng thử lại sau');
                } else if (status >= 500) {
                    throw new Error('Lỗi máy chủ. Vui lòng thử lại sau');
                } else {
                    throw new Error(message);
                }
            } else if (error.request) {
                throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng');
            } else {
                throw new Error('Đã xảy ra lỗi không xác định');
            }
        }
    }, []);

    // === FORM SUBMISSION ===
    // Xử lý submit form đăng ký
    const handleSubmit = useCallback(async (e) => {
        // Ngăn default form submission nếu có event
        if (e) {
            e.preventDefault();
        }

        // Đánh dấu tất cả fields đã được touched để hiển thị validation
        const allFields = Object.keys(formData);
        setTouchedFields(
            allFields.reduce((acc, field) => ({
                ...acc,
                [field]: true
            }), {})
        );

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
            // Gọi API đăng ký
            await registerAPI(formData);
            
            // Hiển thị thông báo thành công
            setMessage({
                type: 'success',
                text: 'Đăng ký thành công! Đang chuyển đến trang đăng nhập...'
            });

            // Reset form
            setFormData({
                loginName: '',
                firstName: '',
                lastName: '',
                password: '',
                confirmPassword: '',
                location: '',
                description: '',
                occupation: ''
            });
            setFieldErrors({});
            setTouchedFields({});

            // Chờ 2 giây rồi chuyển trang
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);

        } catch (error) {
            console.error('Lỗi đăng ký:', error);
            setMessage({
                type: 'error',
                text: error.message || 'Đăng ký thất bại. Vui lòng thử lại'
            });
        } finally {
            setIsLoading(false);
        }
    }, [formData, validateForm, registerAPI, navigate]);

    // Xử lý nhấn Enter trong input
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter' && !isLoading) {
            handleSubmit();
        }
    }, [handleSubmit, isLoading]);

    // === UTILITY FUNCTIONS ===
    // Kiểm tra form có hợp lệ để enable/disable submit button
    const isFormValid = useCallback(() => {
        const requiredFields = ['loginName', 'firstName', 'lastName', 'password', 'confirmPassword', 'location', 'occupation'];
        
        // Kiểm tra tất cả required fields có giá trị
        const hasAllRequired = requiredFields.every(field => formData[field].trim());
        
        // Kiểm tra không có field errors
        const hasNoErrors = Object.keys(fieldErrors).length === 0 || 
                           Object.values(fieldErrors).every(error => !error);
        
        return hasAllRequired && hasNoErrors;
    }, [formData, fieldErrors]);

    // === RENDER ===
    return (
        <div className="register-page">
            {/* Background Elements */}
            <div className="register-background">
                <div className="bg-shape bg-shape-1"></div>
                <div className="bg-shape bg-shape-2"></div>
                <div className="bg-shape bg-shape-3"></div>
            </div>

            {/* Register Container */}
            <div className="register-container">
                <div className="register-card">
                    {/* Header */}
                    <div className="register-header">
                        <div className="register-logo">
                            <div className="logo-icon">📝</div>
                        </div>
                        <h1 className="register-title">Tạo tài khoản mới</h1>
                        <p className="register-subtitle">Điền thông tin để bắt đầu</p>
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

                    {/* Register Form */}
                    <div className="register-form">
                        {/* Login Name Field */}
                        <div className="form-group">
                            <label className="form-label">Tên đăng nhập *</label>
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

                        {/* Name Fields Row */}
                        <div className="form-row">
                            {/* First Name */}
                            <div className="form-group">
                                <label className="form-label">Tên *</label>
                                <div className={`input-container ${fieldErrors.firstName ? 'error' : ''}`}>
                                    <div className="input-icon">👤</div>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        onBlur={() => handleInputBlur('firstName')}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Tên"
                                        disabled={isLoading}
                                        className="form-input"
                                        autoComplete="given-name"
                                    />
                                </div>
                                {fieldErrors.firstName && (
                                    <div className="field-error">{fieldErrors.firstName}</div>
                                )}
                            </div>

                            {/* Last Name */}
                            <div className="form-group">
                                <label className="form-label">Họ *</label>
                                <div className={`input-container ${fieldErrors.lastName ? 'error' : ''}`}>
                                    <div className="input-icon">👤</div>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        onBlur={() => handleInputBlur('lastName')}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Họ"
                                        disabled={isLoading}
                                        className="form-input"
                                        autoComplete="family-name"
                                    />
                                </div>
                                {fieldErrors.lastName && (
                                    <div className="field-error">{fieldErrors.lastName}</div>
                                )}
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="form-group">
                            <label className="form-label">Mật khẩu *</label>
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
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('password')}
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

                        <div className="form-group">
                            <label className="form-label">Xác nhận mật khẩu *</label>
                            <div className={`input-container ${fieldErrors.confirmPassword ? 'error' : ''}`}>
                                <div className="input-icon">🔒</div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    onBlur={() => handleInputBlur('confirmPassword')}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập lại mật khẩu"
                                    disabled={isLoading}
                                    className="form-input"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirmPassword')}
                                    disabled={isLoading}
                                    className="password-toggle"
                                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <div className="field-error">{fieldErrors.confirmPassword}</div>
                            )}
                        </div>

                        {/* Location Field */}
                        <div className="form-group">
                            <label className="form-label">Địa chỉ *</label>
                            <div className={`input-container ${fieldErrors.location ? 'error' : ''}`}>
                                <div className="input-icon">📍</div>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                    onBlur={() => handleInputBlur('location')}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập địa chỉ"
                                    disabled={isLoading}
                                    className="form-input"
                                    autoComplete="address-line1"
                                />
                            </div>
                            {fieldErrors.location && (
                                <div className="field-error">{fieldErrors.location}</div>
                            )}
                        </div>

                        {/* Occupation Field */}
                        <div className="form-group">
                            <label className="form-label">Nghề nghiệp *</label>
                            <div className={`input-container ${fieldErrors.occupation ? 'error' : ''}`}>
                                <div className="input-icon">💼</div>
                                <input
                                    type="text"
                                    value={formData.occupation}
                                    onChange={(e) => handleInputChange('occupation', e.target.value)}
                                    onBlur={() => handleInputBlur('occupation')}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Nhập nghề nghiệp"
                                    disabled={isLoading}
                                    className="form-input"
                                    autoComplete="organization-title"
                                />
                            </div>
                            {fieldErrors.occupation && (
                                <div className="field-error">{fieldErrors.occupation}</div>
                            )}
                        </div>

                        {/* Description Field (Optional) */}
                        <div className="form-group">
                            <label className="form-label">Mô tả (không bắt buộc)</label>
                            <div className={`input-container ${fieldErrors.description ? 'error' : ''}`}>
                                <div className="input-icon">📝</div>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    onBlur={() => handleInputBlur('description')}
                                    placeholder="Giới thiệu về bản thân..."
                                    disabled={isLoading}
                                    className="form-textarea"
                                    rows="3"
                                />
                            </div>
                            {fieldErrors.description && (
                                <div className="field-error">{fieldErrors.description}</div>
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
                                    <span>Đang đăng ký...</span>
                                </>
                            ) : (
                                'Tạo tài khoản'
                            )}
                        </button>
                    </div>

                    {/* Footer Links */}
                    <div className="register-footer">
                        <p className="footer-text">
                            Đã có tài khoản?{' '}
                            <button 
                                className="footer-link"
                                onClick={() => navigate('/login')}
                                disabled={isLoading}
                            >
                                Đăng nhập ngay
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;