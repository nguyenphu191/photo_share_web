import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const TopBar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const userLogin = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (userLogin) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        navigate('/login');
    };

    const handleHome = () => {
        navigate('/home');
    };

    const handleProfile = () => {
        navigate('/profile');
    };

    return (
        <div className="topBar">
            <div onClick={handleHome}>
                <img src="/images/home.svg" alt="Home" />
            </div>
            
            {isLoggedIn ? (
                <>
                    <span>Hello, {userLogin.first_name}</span>
                    <button onClick={handleLogout}>Đăng xuất</button>
                </>
            ) : (
                <span>
                    <Link to="/login">Hãy đăng nhập</Link>
                </span>
            )}
        </div>
    );
};

export default TopBar;
