const mongoose = require("mongoose");

/**
 * Define the Mongoose Schema for a Comment.
 */
const commentSchema = new mongoose.Schema({
  // The text of the comment.
  comment: String,
  // The date and time when the comment was created.
  date_time: { type: Date, default: Date.now },
  // The ID of the user who created the comment.
  user_id: mongoose.Schema.Types.ObjectId,
});

/**
 * Define the Mongoose Schema for a Photo.
 */
const photoSchema = new mongoose.Schema({
  title: { type: String },
  file_name: { type: String },
  date_time: { type: Date, default: Date.now },
  user_id: mongoose.Schema.Types.ObjectId,
  comments: [commentSchema],
});

/**
 * Create a Mongoose Model for a Photo using the photoSchema.
 */
const Photo = mongoose.model.Photos || mongoose.model("Photos", photoSchema);

/**
 * Make this available to our application.
 */
module.exports = Photo;
