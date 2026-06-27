const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, trim: true, required: true },
}, { timestamps: true });

const answerSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, trim: true, required: true },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies: [replySchema],
}, { timestamps: true });

const communityQuestionSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, trim: true, required: true },
  body: { type: String, trim: true, required: true },
  tags: { type: [String], default: [] },
  answers: [answerSchema],
}, { timestamps: true });

module.exports = mongoose.model('CommunityQuestion', communityQuestionSchema);
