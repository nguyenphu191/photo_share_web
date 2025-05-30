const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index để tăng tốc query
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendSchema.index({ requester: 1, status: 1 });
friendSchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model("Friends", friendSchema);