const express = require('express');
const ChatRequest = require('../models/ChatRequest');
const Message = require('../models/Message');
const Session = require('../models/Session');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const userSelect = 'username email bio skills teachSkills learnSkills credits ratings';
const SESSION_CREDIT_COST = 100;

const emitToUsers = (req, userIds, event, payload) => {
  const io = req.app.get('io');
  if (!io) return;
  userIds.forEach((userId) => io.to(String(userId._id || userId)).emit(event, payload));
};

const generateMeetUrl = () => {
  return 'https://meet.google.com/new';
};

const getPartnerId = (message, currentUserId) => {
  const sender = String(message.sender._id || message.sender);
  const recipient = String(message.recipient._id || message.recipient);
  return sender === String(currentUserId) ? recipient : sender;
};

const findLearningRoles = async (userA, userB) => {
  const request = await ChatRequest.findOne({
    status: 'accepted',
    $or: [
      { from: userA, to: userB },
      { from: userB, to: userA },
    ],
  }).sort({ updatedAt: -1 });

  if (!request) {
    return { learner: userA, teacher: userB, request: null };
  }

  return { learner: request.from, teacher: request.to, request };
};

router.post('/request', auth, async (req, res) => {
  try {
    const { toUserId, skill, message } = req.body;
    if (!toUserId) {
      return res.status(400).json({ message: 'Recipient is required' });
    }
    if (String(toUserId) === String(req.userId)) {
      return res.status(400).json({ message: 'You cannot request yourself' });
    }

    const learner = await User.findById(req.userId).select('credits');
    if (!learner || learner.credits < SESSION_CREDIT_COST) {
      return res.status(402).json({ message: 'You need at least 100 credits to request a taught session.' });
    }

    const request = await ChatRequest.create({
      from: req.userId,
      to: toUserId,
      skill,
      message,
    });
    const populated = await request.populate([
      { path: 'from', select: userSelect },
      { path: 'to', select: userSelect },
    ]);

    emitToUsers(req, [toUserId, req.userId], 'chat:request', populated);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Unable to create request' });
  }
});

router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await ChatRequest.find({
      $or: [{ from: req.userId }, { to: req.userId }],
    })
      .populate('from', userSelect)
      .populate('to', userSelect)
      .sort({ createdAt: -1 });

    res.json({
      incoming: requests.filter((request) => String(request.to._id) === String(req.userId)),
      outgoing: requests.filter((request) => String(request.from._id) === String(req.userId)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load requests' });
  }
});

router.post('/request/:id/:action', auth, async (req, res) => {
  try {
    const { action } = req.params;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await ChatRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    if (String(request.to) !== String(req.userId)) {
      return res.status(403).json({ message: 'Only the recipient can respond' });
    }

    if (action === 'accept') {
      const learner = await User.findById(request.from).select('credits');
      if (!learner || learner.credits < SESSION_CREDIT_COST) {
        return res.status(402).json({ message: 'Learner needs at least 100 credits before this request can be accepted.' });
      }
    }

    request.status = action === 'accept' ? 'accepted' : 'rejected';
    await request.save();

    let starterMessage = null;
    if (request.status === 'accepted') {
      starterMessage = await Message.create({
        sender: req.userId,
        recipient: request.from,
        text: `Request accepted${request.skill ? ` for ${request.skill}` : ''}.`,
      });
      await starterMessage.populate([
        { path: 'sender', select: userSelect },
        { path: 'recipient', select: userSelect },
      ]);
    }

    const populated = await request.populate([
      { path: 'from', select: userSelect },
      { path: 'to', select: userSelect },
    ]);

    emitToUsers(req, [request.from, request.to], 'chat:request-updated', { request: populated, message: starterMessage });
    res.json({ request: populated, message: starterMessage });
  } catch (error) {
    res.status(500).json({ message: 'Unable to update request' });
  }
});

router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.userId }, { recipient: req.userId }],
    })
      .populate('sender', userSelect)
      .populate('recipient', userSelect)
      .sort({ createdAt: -1 })
      .limit(200);

    const acceptedRequests = await ChatRequest.find({
      status: 'accepted',
      $or: [{ from: req.userId }, { to: req.userId }],
    })
      .populate('from', userSelect)
      .populate('to', userSelect)
      .sort({ updatedAt: -1 });

    const conversationMap = new Map();
    messages.forEach((message) => {
      const partnerId = getPartnerId(message, req.userId);
      if (conversationMap.has(partnerId)) return;
      const partner = String(message.sender._id) === String(req.userId) ? message.recipient : message.sender;
      conversationMap.set(partnerId, { user: partner, lastMessage: message, updatedAt: message.createdAt });
    });

    acceptedRequests.forEach((request) => {
      const partner = String(request.from._id) === String(req.userId) ? request.to : request.from;
      const partnerId = String(partner._id);
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, { user: partner, lastMessage: null, updatedAt: request.updatedAt });
      }
    });

    res.json([...conversationMap.values()].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
  } catch (error) {
    res.status(500).json({ message: 'Unable to load conversations' });
  }
});

router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.userId },
      ],
    })
      .populate('sender', userSelect)
      .populate('recipient', userSelect)
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load messages' });
  }
});

router.post('/start-session', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'Session partner is required' });
    }
    const roles = await findLearningRoles(req.userId, userId);
    const learner = await User.findById(roles.learner).select('credits');
    if (!learner || learner.credits < SESSION_CREDIT_COST) {
      return res.status(402).json({ message: 'Learner needs at least 100 credits to start a taught session.' });
    }

    const meetUrl = req.body.meetUrl || generateMeetUrl();
    const session = await Session.create({
      participants: [req.userId, userId],
      learner: roles.learner,
      teacher: roles.teacher,
      meetUrl,
    });
    const message = await Message.create({
      sender: req.userId,
      recipient: userId,
      text: 'Video session link shared.',
      meetingUrl: meetUrl,
    });
    await message.populate([
      { path: 'sender', select: userSelect },
      { path: 'recipient', select: userSelect },
    ]);

    emitToUsers(req, [req.userId, userId], 'chat:message', message);
    emitToUsers(req, [req.userId, userId], 'chat:session-started', { session, message });
    res.status(201).json({ session, message });
  } catch (error) {
    res.status(500).json({ message: 'Unable to start session' });
  }
});

router.post('/complete-session', auth, async (req, res) => {
  try {
    const { userId, sessionId, rating } = req.body;
    const numericRating = Number(rating);
    if (!userId || !numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Partner and rating from 1 to 5 are required' });
    }

    const session = sessionId
      ? await Session.findById(sessionId)
      : await Session.findOne({ participants: { $all: [req.userId, userId] }, status: 'active' }).sort({ createdAt: -1 });

    if (!session) {
      return res.status(404).json({ message: 'Start a video session before completing it.' });
    }

    const roles = session?.learner && session?.teacher
      ? { learner: session.learner, teacher: session.teacher }
      : await findLearningRoles(req.userId, userId);
    const learnerId = roles.learner;
    const teacherId = roles.teacher;

    if (session?.creditsSettled) {
      return res.status(400).json({ message: 'Credits have already been settled for this session.' });
    }

    const learner = await User.findById(learnerId).select('credits');
    if (!learner || learner.credits < SESSION_CREDIT_COST) {
      return res.status(402).json({ message: 'Learner needs at least 100 credits to complete this session.' });
    }

    await User.findByIdAndUpdate(learnerId, { $inc: { credits: -SESSION_CREDIT_COST } });
    await User.findByIdAndUpdate(teacherId, {
      $inc: { credits: SESSION_CREDIT_COST },
      $set: { ratings: numericRating },
    });

    if (session) {
      session.status = 'completed';
      session.completedBy = req.userId;
      session.rating = numericRating;
      session.learner = learnerId;
      session.teacher = teacherId;
      session.creditsSettled = true;
      await session.save();
    }

    const message = await Message.create({
      sender: req.userId,
      recipient: userId,
      text: `Session completed with a ${numericRating}/5 rating. 100 credits moved from learner to teacher.`,
    });
    await message.populate([
      { path: 'sender', select: userSelect },
      { path: 'recipient', select: userSelect },
    ]);

    emitToUsers(req, [req.userId, userId], 'chat:message', message);
    emitToUsers(req, [req.userId, userId], 'chat:session-completed', { session, rating: numericRating, message });
    res.json({ session, rating: numericRating, message });
  } catch (error) {
    res.status(500).json({ message: 'Unable to complete session' });
  }
});

module.exports = router;
