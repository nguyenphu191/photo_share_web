const express = require("express");
const User = require("../models/UserModel.js");
const router = express.Router();
const jwtAuth = require("../middleware/auth.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo thư mục uploads nếu chưa tồn tại
const createUploadsDir = () => {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  const photosDir = path.join(uploadsDir, "photos");
  const avatarsDir = path.join(uploadsDir, "avatars");
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
};

// Tạo thư mục khi khởi động
createUploadsDir();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads", "avatars"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, "avatar-" + uniqueSuffix);
  },
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ cho phép upload file ảnh!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
});

router.post("/", async (request, response) => {});

router.get("/list", jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Lấy danh sách friend IDs
    const friends = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const friendIds = friends.map(friend => 
      friend.requester.toString() === userId ? friend.recipient : friend.requester
    );

    // Lấy thông tin users từ friend IDs
    const users = await User.find({ 
      _id: { $in: friendIds } 
    }, "_id first_name last_name location description occupation login_name avatar");
    
    res.send(users);
  } catch (error) {
    res.status(500).send({ error: "Không thể truy xuất bạn bè" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id,
      "_id first_name last_name location description occupation login_name avatar",
    );
    if (!user) {
      return res.status(400).send({ error: "Không tìm thấy người dùng" });
    }
    res.send(user);
  } catch (error) {
    res.status(400).send({ error: "ID người dùng không hợp lệ" });
  }
});

router.post("/update", jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = req.body;
    console.log(userId, req.body.userId);

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    const { password, ...userData } = updatedUser.toObject();
    res.send(userData);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Internal server error" });
  }
});

router.post('/upload-avatar', jwtAuth, upload.single('avatar'), async (req, res) => {
  console.log('Upload avatar request:', req.file, req.userId);

  try {
    if (!req.file) {
      return res.status(400).send({ error: "Không có file nào được tải lên" });
    }

    const userId = req.userId;
    const avatarPath = `/uploads/avatars/${req.file.filename}`;

    // 📌 Lấy thông tin user hiện tại để kiểm tra và xóa ảnh cũ nếu có
    const currentUser = await User.findById(userId);

    if (currentUser && currentUser.avatar) {
      const oldAvatarPath = path.join(__dirname, "..", currentUser.avatar);

      // Kiểm tra file tồn tại và xóa
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
        console.log("Đã xóa ảnh cũ:", oldAvatarPath);
      }
    }

    // Cập nhật avatar trong database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).send({ error: "Không tìm thấy người dùng" });
    }

    res.status(200).send({
      message: "Cập nhật ảnh đại diện thành công",
      avatar: avatarPath,
      user: updatedUser
    });

  } catch (error) {
    console.error('Lỗi upload avatar:', error);
    res.status(500).send({ error: "Không thể cập nhật ảnh đại diện" });
  }
});

router.get("/available", jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Lấy danh sách friend IDs và pending requests
    const friends = await Friend.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    });

    const excludeIds = [userId]; // Exclude self
    
    // Add all friends and pending requests to exclude list
    friends.forEach(friend => {
      if (friend.requester.toString() !== userId) {
        excludeIds.push(friend.requester);
      }
      if (friend.recipient.toString() !== userId) {
        excludeIds.push(friend.recipient);
      }
    });

    // Lấy users không nằm trong exclude list
    const availableUsers = await User.find({ 
      _id: { $nin: excludeIds } 
    }, "_id first_name last_name location description occupation login_name avatar");
    
    res.send(availableUsers);
  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).send({ error: "Không thể truy xuất người dùng" });
  }
});
module.exports = router;