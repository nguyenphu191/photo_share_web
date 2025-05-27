const jwt = require("jsonwebtoken");

const JWT_SECRET = "phu@toapp_secret"; // Nên đặt trong environment variables

const jwtAuth = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Kiểm tra format "Bearer <token>"
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'Access denied. Invalid token format.' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Thêm userId vào request object
    req.userId = decoded.userId;
    
    console.log('Authenticated user ID:', req.userId); // Debug log
    
    next();
  } catch (error) {
    console.error('JWT Auth Error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    } else {
      return res.status(500).json({ error: 'Token verification failed.' });
    }
  }
};

module.exports = jwtAuth;