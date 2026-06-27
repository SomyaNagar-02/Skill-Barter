const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  meetUrl: { type: String, trim: true, default: '' },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rating: { type: Number, min: 1, max: 5, default: null },
  creditsSettled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
