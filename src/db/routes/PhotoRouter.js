const express = require("express");
const Photo = require("../models/PhotoModel.js");
const router = express.Router();
const User = require("../models/UserModel.js");
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .send({ error: "Không có file nào được tải lên" });
  }

  try {
    const newPhoto = new Photo({
      title: '',
      file_name: req.body.file_name,
      user_id: req.body.user_id,
      date_time: new Date(),
    });
    await newPhoto.save();
    res.status(201).send(newPhoto);
  } catch (error) {
    res.status(500).send({ error: "Không thể lưu ảnh" });
  }
});

router.post("/commentsOfPhoto/:photoId", async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const { comment, userId } = req.body;

    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    photo.comments.push({ comment, user_id: userId });

    const updatedPhoto = await photo.save();

    res.status(201).json(updatedPhoto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi đăng comment" });
  }
});
router.delete("/delete/:id", async (req, res) => {
  try {
    const photoId = req.params.id;

    const photoExists = await Photo.exists({ _id: photoId });
    if (!photoExists) {
      return res.status(400).send({ error: "Ảnh không tồn tại" });
    }

    await Photo.findByIdAndDelete(photoId);

    res.send({ message: "Ảnh đã được xóa thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Đã xảy ra lỗi" });
  }
});

router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find({});
    res.send(photos);
  } catch (error) {
    res.status(500).send({ error: "Không thể truy xuất người dùng" });
  }
});
router.get("/photosOfUser/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(400).send({ error: "Người dùng không tồn tại" });
    }
    console.log("success");
    const photos = await Photo.find({ user_id: userId });

    if (photos.length === 0) {
      return res
        .status(404)
        .send({ error: "Chua có ảnh nào cho người dùng này" });
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
    console.error(error);
    res.status(500).send({ error: "Đã xảy ra lỗi" });
  }
});


module.exports = router;
