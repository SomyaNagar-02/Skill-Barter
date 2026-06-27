const express = require('express');
const CommunityQuestion = require('../models/CommunityQuestion');
const auth = require('../middleware/auth');

const router = express.Router();

const userSelect = 'username email bio skills teachSkills learnSkills credits ratings';

const populateQuestion = (query) => query
  .populate('author', userSelect)
  .populate('answers.author', userSelect)
  .populate('answers.replies.author', userSelect);

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof tags === 'string') return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  return [];
};

router.post('/create', auth, async (req, res) => {
  try {
    const { title, body, tags } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: 'Title and question details are required' });
    }

    const question = await CommunityQuestion.create({
      author: req.userId,
      title,
      body,
      tags: parseTags(tags),
    });
    const populated = await populateQuestion(CommunityQuestion.findById(question._id));
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create question' });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const questions = await populateQuestion(
      CommunityQuestion.find().sort({ updatedAt: -1 }).limit(60),
    );
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load community questions' });
  }
});

router.post('/answer/:questionId', auth, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ message: 'Answer text is required' });
    }

    const question = await CommunityQuestion.findById(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.answers.push({ author: req.userId, body });
    await question.save();
    const populated = await populateQuestion(CommunityQuestion.findById(question._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to add answer' });
  }
});

router.post('/reply/:answerId', auth, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const question = await CommunityQuestion.findOne({ 'answers._id': req.params.answerId });
    if (!question) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const answer = question.answers.id(req.params.answerId);
    answer.replies.push({ author: req.userId, body });
    await question.save();
    const populated = await populateQuestion(CommunityQuestion.findById(question._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to add reply' });
  }
});

router.post('/upvote/:answerId', auth, async (req, res) => {
  try {
    const question = await CommunityQuestion.findOne({ 'answers._id': req.params.answerId });
    if (!question) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const answer = question.answers.id(req.params.answerId);
    const existingIndex = answer.upvotes.findIndex((userId) => String(userId) === String(req.userId));
    if (existingIndex >= 0) {
      answer.upvotes.splice(existingIndex, 1);
    } else {
      answer.upvotes.push(req.userId);
    }

    await question.save();
    const populated = await populateQuestion(CommunityQuestion.findById(question._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to update upvote' });
  }
});

module.exports = router;
