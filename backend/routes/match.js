const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const query = String(req.query.query || '').trim();
    const filter = ['skill', 'username'].includes(req.query.filter) ? req.query.filter : 'all';
    const regex = query ? new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    const conditions = [{ _id: { $ne: req.userId } }];
    if (regex && filter === 'skill') {
      conditions.push({ $or: [{ teachSkills: regex }, { skills: regex }] });
    }
    if (regex && filter === 'username') {
      conditions.push({ username: regex });
    }
    if (regex && filter === 'all') {
      conditions.push({
        $or: [
          { username: regex },
          { bio: regex },
          { teachSkills: regex },
          { learnSkills: regex },
          { skills: regex },
        ],
      });
    }

    const users = await User.find({ $and: conditions })
      .select('username email bio skills teachSkills learnSkills credits ratings')
      .sort({ ratings: -1, credits: -1, username: 1 })
      .limit(24);

    res.json(users.map((user) => ({
      ...user.toObject(),
      teachSkills: user.teachSkills?.length ? user.teachSkills : user.skills,
    })));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load matches' });
  }
});

module.exports = router;
