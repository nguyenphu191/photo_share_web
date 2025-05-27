const express = require("express");
const Photo = require("../models/PhotoModel.js");
const router = express.Router();
const User = require("../models/UserModel.js");
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
    cb(null, path.join(__dirname, "..", "uploads", "photos"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, "photo-" + uniqueSuffix);
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

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "Không có file nào được tải lên" });
    }

    if (!req.body.user_id) {
      return res.status(400).send({ error: "Thiếu thông tin user_id" });
    }

    // Kiểm tra user có tồn tại không
    const userExists = await User.findById(req.body.user_id);
    if (!userExists) {
      return res.status(400).send({ error: "Người dùng không tồn tại" });
    }

    // Tạo đường dẫn file để lưu vào database
    const filePath = `/uploads/photos/${req.file.filename}`;

    const newPhoto = new Photo({
      title: req.body.title || '',
      file_name: filePath, // Lưu đường dẫn file thực tế
      user_id: req.body.user_id,
      date_time: new Date(),
      comments: [] // Khởi tạo array comments rỗng
    });

    const savedPhoto = await newPhoto.save();
    
    // Trả về photo với format phù hợp
    const responsePhoto = {
      _id: savedPhoto._id,
      title: savedPhoto.title,
      file_name: savedPhoto.file_name,
      user_id: savedPhoto.user_id,
      date_time: savedPhoto.date_time,
      comments: []
    };

    res.status(201).send(responsePhoto);
  } catch (error) {
    console.error('Lỗi upload photo:', error);
    res.status(500).send({ error: "Không thể lưu ảnh" });
  }
});

router.post("/commentsOfPhoto/:photoId", async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const { comment, userId } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).send({ error: "Comment không được để trống" });
    }

    if (!userId) {
      return res.status(400).send({ error: "Thiếu thông tin userId" });
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "Người dùng không tồn tại" });
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send({ error: "Photo không tồn tại" });
    }

    // Tạo comment mới
    const newComment = {
      comment: comment.trim(),
      user_id: userId,
      date_time: new Date()
    };

    photo.comments.push(newComment);
    const updatedPhoto = await photo.save();

    // Lấy comment vừa được thêm (comment cuối cùng)
    const addedComment = updatedPhoto.comments[updatedPhoto.comments.length - 1];
    
    // Format response với thông tin user
    const responseComment = {
      _id: addedComment._id,
      comment: addedComment.comment,
      date_time: addedComment.date_time,
      user_id: addedComment.user_id,
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name
      }
    };

    res.status(201).json(responseComment);
  } catch (error) {
    console.error('Lỗi khi thêm comment:', error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi đăng comment" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const photoId = req.params.id;

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send({ error: "Ảnh không tồn tại" });
    }

    // Xóa file vật lý nếu tồn tại
    if (photo.file_name) {
      const filePath = path.join(__dirname, "..", photo.file_name);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileError) {
          console.error('Lỗi khi xóa file:', fileError);
          // Không return error ở đây, vẫn tiếp tục xóa record trong DB
        }
      }
    }

    await Photo.findByIdAndDelete(photoId);
    res.send({ message: "Ảnh đã được xóa thành công" });
  } catch (error) {
    console.error('Lỗi khi xóa photo:', error);
    res.status(500).send({ error: "Đã xảy ra lỗi khi xóa ảnh" });
  }
});

router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find({});
    res.send(photos);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách photos:', error);
    res.status(500).send({ error: "Không thể truy xuất ảnh" });
  }
});

router.get("/photosOfUser/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).send({ error: "Người dùng không tồn tại" });
    }

    const photos = await Photo.find({ user_id: userId }).sort({ date_time: -1 });

    if (photos.length === 0) {
      return res.status(404).send({ error: "Chưa có ảnh nào cho người dùng này" });
    }

    const formattedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const formattedComments = await Promise.all(
          photo.comments.map(async (comment) => {
            const user = await User.findById(comment.user_id).select(
              "_id first_name last_name",
            );

            return {
              _id: comment._id,
              comment: comment.comment,
              date_time: comment.date_time,
              user_id: comment.user_id,
              user: user
                ? {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                  }
                : null,
            };
          }),
        );

        return {
          _id: photo._id,
          user_id: photo.user_id,
          file_name: photo.file_name,
          date_time: photo.date_time,
          comments: formattedComments,
          title: photo.title,
        };
      }),
    );

    res.send(formattedPhotos);
  } catch (error) {
    console.error('Lỗi khi lấy photos của user:', error);
    res.status(500).send({ error: "Đã xảy ra lỗi" });
  }
});

module.exports = router;