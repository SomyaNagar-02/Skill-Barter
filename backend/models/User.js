const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, unique: true },
  email: { type: String, required: true, trim: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  bio: { type: String, trim: true, default: 'I am ready to barter skills.' },
  skills: { type: [String], default: [] },
  teachSkills: { type: [String], default: [] },
  learnSkills: { type: [String], default: [] },
  phone: { type: String, trim: true, default: '' },
  gender: { type: String, trim: true, default: '' },
  credits: { type: Number, default: 100 },
  ratings: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
