const express = require("express");
const Photo = require("../models/PhotoModel.js");
const User = require("../models/UserModel.js");
const jwtAuth = require("../middleware/auth.js");
const router = express.Router();

const REACTION_TYPES = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

// POST /:photoId - Thêm/cập nhật reaction
router.post("/:photoId", jwtAuth, async (req, res) => {
  try {
    const { photoId } = req.params;
    const { type } = req.body;
    const userId = req.userId;

    if (!REACTION_TYPES.includes(type)) {
      return res.status(400).json({ error: "Loại cảm xúc không hợp lệ" });
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: "Không tìm thấy ảnh" });
    }

    const existingReactionIndex = photo.reactions.findIndex(
      reaction => reaction.user_id.toString() === userId
    );

    if (existingReactionIndex !== -1) {
      const existingReaction = photo.reactions[existingReactionIndex];
      
      if (existingReaction.type === type) {
        // Remove reaction
        photo.reactions.splice(existingReactionIndex, 1);
        if (photo.reaction_stats[type] > 0) {
          photo.reaction_stats[type]--;
          photo.reaction_stats.total--;
        }
        await photo.save();
        return res.json({ message: "Đã bỏ cảm xúc", action: "removed", stats: photo.reaction_stats });
      } else {
        // Update reaction
        const oldType = existingReaction.type;
        photo.reactions[existingReactionIndex].type = type;
        photo.reactions[existingReactionIndex].date_time = new Date();
        
        if (photo.reaction_stats[oldType] > 0) {
          photo.reaction_stats[oldType]--;
        }
        photo.reaction_stats[type]++;
        
        await photo.save();
        return res.json({ message: "Đã cập nhật cảm xúc", action: "updated", reactionType: type, stats: photo.reaction_stats });
      }
    } else {
      // Add new reaction
      photo.reactions.push({ type, user_id: userId, date_time: new Date() });
      photo.reaction_stats[type]++;
      photo.reaction_stats.total++;
      
      await photo.save();
      return res.json({ message: "Đã thêm cảm xúc", action: "added", reactionType: type, stats: photo.reaction_stats });
    }
  } catch (error) {
    console.error("Lỗi reaction:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// GET /:photoId - Lấy reactions của ảnh
router.get("/:photoId", async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) {
      return res.status(404).json({ error: "Không tìm thấy ảnh" });
    }

    const reactionsWithUsers = await Promise.all(
      photo.reactions.map(async (reaction) => {
        const user = await User.findById(reaction.user_id).select("_id first_name last_name avatar");
        return {
          _id: reaction._id,
          type: reaction.type,
          date_time: reaction.date_time,
          user_id: reaction.user_id,
          user: user ? {
            _id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar
          } : null
        };
      })
    );

    res.json({ reactions: reactionsWithUsers, stats: photo.reaction_stats });
  } catch (error) {
    res.status(500).json({ error: "Lỗi server" });
  }
});
router.delete("/:photoId", jwtAuth, async (req, res) => {
    try {
      const { photoId } = req.params;
      const userId = req.userId;
  
      const photo = await Photo.findById(photoId);
      if (!photo) {
        return res.status(404).json({ error: "Không tìm thấy ảnh" });
      }
  
      const reactionIndex = photo.reactions.findIndex(
        reaction => reaction.user_id.toString() === userId
      );
  
      if (reactionIndex === -1) {
        return res.status(404).json({ error: "Bạn chưa react ảnh này" });
      }
  
      const removedReaction = photo.reactions[reactionIndex];
      photo.reactions.splice(reactionIndex, 1);
  
      // Cập nhật stats
      if (photo.reaction_stats[removedReaction.type] > 0) {
        photo.reaction_stats[removedReaction.type]--;
        photo.reaction_stats.total--;
      }
  
      await photo.save();
  
      res.status(200).json({
        message: "Đã xóa cảm xúc",
        removedType: removedReaction.type,
        stats: photo.reaction_stats
      });
    } catch (error) {
      console.error("Lỗi khi xóa reaction:", error);
      res.status(500).json({ error: "Đã xảy ra lỗi khi xóa cảm xúc" });
    }
  });
/**
 * GET /api/reaction/:photoId/user/:userId
 * Lấy reaction của user cụ thể cho ảnh
 */
 router.get("/:photoId/user/:userId", async (req, res) => {
   try {
     const { photoId, userId } = req.params;
 
     const photo = await Photo.findById(photoId);
     if (!photo) {
       return res.status(404).json({ error: "Không tìm thấy ảnh" });
     }
 
     const userReaction = photo.reactions.find(
       reaction => reaction.user_id.toString() === userId
     );
 
     if (userReaction) {
       res.status(200).json({
         hasReaction: true,
         reaction: {
           type: userReaction.type,
           date_time: userReaction.date_time
         }
       });
     } else {
       res.status(200).json({
         hasReaction: false,
         reaction: null
       });
     }
   } catch (error) {
     console.error("Lỗi khi kiểm tra reaction:", error);
     res.status(500).json({ error: "Đã xảy ra lỗi" });
   }
 });
module.exports = router;