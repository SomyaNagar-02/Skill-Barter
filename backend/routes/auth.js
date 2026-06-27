const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const parseSkillList = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    const user = await User.create({ username, email, password });
    const token = createToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (typeof user.credits !== 'number') {
      user.credits = 100;
      await user.save();
    }
    const token = createToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Signin failed', error: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load profile' });
  }
});

router.put('/update', auth, async (req, res) => {
  try {
    const updates = (({ username, bio, skills, teachSkills, learnSkills, phone, gender }) => ({
      username,
      bio,
      skills,
      teachSkills,
      learnSkills,
      phone,
      gender,
    }))(req.body);

    if (updates.teachSkills !== undefined) {
      updates.teachSkills = parseSkillList(updates.teachSkills);
      updates.skills = updates.teachSkills;
    } else if (updates.skills !== undefined) {
      updates.skills = parseSkillList(updates.skills);
      updates.teachSkills = updates.skills;
    }

    if (updates.learnSkills !== undefined) {
      updates.learnSkills = parseSkillList(updates.learnSkills);
    }
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Update failed' });
  }
});

module.exports = router;
