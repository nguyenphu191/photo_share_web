const express = require("express");
const Friend = require("../models/FriendModel.js");
const User = require("../models/UserModel.js");
const jwtAuth = require("../middleware/auth.js");
const router = express.Router();

// GET /api/friend/my-link - Lấy link kết bạn
router.get("/my-link", jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const friendLink = `${req.protocol}://${req.get('host')}/add-friend/${userId}`;
    res.json({ friendLink, userId });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// POST /api/friend/send-request - Gửi lời mời kết bạn
router.post("/send-request", jwtAuth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.userId;

    if (requesterId === recipientId) {
      return res.status(400).json({ error: "Không thể kết bạn với chính mình" });
    }

    // Check recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    // Check existing friendship
    const existingFriend = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingFriend) {
      if (existingFriend.status === 'accepted') {
        return res.status(400).json({ error: "Đã là bạn bè" });
      } else if (existingFriend.status === 'pending') {
        return res.status(400).json({ error: "Lời mời đã được gửi" });
      }
    }

    // Create friend request
    const newFriend = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    await newFriend.save();
    res.status(201).json({ message: "Đã gửi lời mời kết bạn" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// PUT /api/friend/respond/:friendId - Chấp nhận/từ chối lời mời
router.put("/respond/:friendId", jwtAuth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const { action } = req.body; // 'accepted' or 'declined'
    const userId = req.userId;

    const friendship = await Friend.findOne({
      _id: friendId,
      recipient: userId,
      status: 'pending'
    });

    if (!friendship) {
      return res.status(404).json({ error: "Lời mời không tồn tại" });
    }

    friendship.status = action;
    friendship.updated_at = new Date();
    await friendship.save();

    res.json({ message: action === 'accepted' ? "Đã chấp nhận kết bạn" : "Đã từ chối" });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /api/friend/list - Lấy danh sách bạn bè
router.get("/list", jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const friends = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    }).populate('requester recipient', '_id first_name last_name avatar occupation location');

    const friendList = friends.map(friend => {
      const friendUser = friend.requester._id.toString() === userId ? friend.recipient : friend.requester;
      return {
        _id: friendUser._id,
        first_name: friendUser.first_name,
        last_name: friendUser.last_name,
        avatar: friendUser.avatar,
        occupation: friendUser.occupation,
        location: friendUser.location
      };
    });

    res.json(friendList);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /api/friend/requests - Lấy lời mời kết bạn
router.get("/requests", jwtAuth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const requests = await Friend.find({
      recipient: userId,
      status: 'pending'
    }).populate('requester', '_id first_name last_name avatar').sort({ created_at: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;