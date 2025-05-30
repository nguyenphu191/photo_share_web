const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  // Loại cảm xúc: like, love, haha, wow, sad, angry
  type: {
    type: String,
    enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
    required: true
  },
  // ID của user thả cảm xúc
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  // Thời gian thả cảm xúc
  date_time: { 
    type: Date, 
    default: Date.now 
  }
});

const commentSchema = new mongoose.Schema({
  comment: String,
  date_time: { type: Date, default: Date.now },
  user_id: mongoose.Schema.Types.ObjectId,
});


const photoSchema = new mongoose.Schema({
  title: { type: String },
  file_name: { type: String },
  date_time: { type: Date, default: Date.now },
  user_id: mongoose.Schema.Types.ObjectId,
  comments: [commentSchema],
  reactions: [reactionSchema],
  reaction_stats: {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    haha: { type: Number, default: 0 },
    wow: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  }
});

photoSchema.index({ 'reactions.user_id': 1, 'reactions.type': 1 });
photoSchema.index({ _id: 1, 'reactions.user_id': 1 });


const Photo = mongoose.model.Photos || mongoose.model("Photos", photoSchema);

module.exports = Photo;