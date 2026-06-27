const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  type: { type: String, default: '' },
  size: { type: Number, default: 0 },
  dataUrl: { type: String, default: '' },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, trim: true, default: '' },
  attachment: { type: attachmentSchema, default: null },
  meetingUrl: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
