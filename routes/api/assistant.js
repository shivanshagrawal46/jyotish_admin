const express = require('express');
const router = express.Router();
const AssistantChatSession = require('../../models/AssistantChatSession');
const AssistantChatMessage = require('../../models/AssistantChatMessage');
const { processAssistantChat } = require('../../services/assistantChatService');
const { searchAppContent } = require('../../services/assistantSearchService');

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

router.post('/chat', async (req, res) => {
  try {
    const { userId, message, sessionId } = req.body || {};
    const result = await processAssistantChat({
      userId,
      message,
      sessionId,
      source: 'api'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    const payload = {
      success: false,
      error: error.message || 'Failed to process assistant chat.'
    };
    // Include real error in response when DEBUG_ASSISTANT=1 (for debugging only)
    if (process.env.DEBUG_ASSISTANT === '1') {
      payload.debug = {
        originalError: (error && error.originalMessage) || (error && error.message) || String(error)
      };
    }
    res.status(400).json(payload);
  }
});

router.get('/search', async (req, res) => {
  try {
    const query = normalizeSpace(req.query.q || req.query.query || '');
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required. Use ?q=your_text'
      });
    }

    const limit = Number(req.query.limit) || 12;
    const data = await searchAppContent(query, { limit });
    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Search failed.'
    });
  }
});

router.get('/sessions/:userId', async (req, res) => {
  try {
    const userId = normalizeSpace(req.params.userId);
    const sessions = await AssistantChatSession.find({ userId })
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: sessions.map((session) => ({
        sessionId: String(session._id),
        userId: session.userId,
        title: session.title,
        source: session.source,
        lastMessageAt: session.lastMessageAt,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch sessions.'
    });
  }
});

router.get('/messages/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
    const messages = await AssistantChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: messages.reverse().map((message) => ({
        id: String(message._id),
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        createdAt: message.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch messages.'
    });
  }
});

// ─── ADMIN ENDPOINTS ───

router.get('/admin/users', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $group: {
          _id: '$userId',
          totalSessions: { $sum: 1 },
          lastActiveAt: { $max: '$lastMessageAt' },
          firstChatAt: { $min: '$createdAt' }
        }
      },
      { $sort: { lastActiveAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const users = await AssistantChatSession.aggregate(pipeline);
    const totalUsers = await AssistantChatSession.distinct('userId');

    res.json({
      success: true,
      data: {
        users: users.map((u) => ({
          userId: u._id,
          totalSessions: u.totalSessions,
          lastActiveAt: u.lastActiveAt,
          firstChatAt: u.firstChatAt
        })),
        pagination: {
          page,
          limit,
          totalUsers: totalUsers.length,
          totalPages: Math.ceil(totalUsers.length / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch users.' });
  }
});

router.get('/admin/sessions', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 20, 100));
    const skip = (page - 1) * limit;
    const userId = normalizeSpace(req.query.userId || '');

    const filter = userId ? { userId } : {};
    const total = await AssistantChatSession.countDocuments(filter);
    const sessions = await AssistantChatSession.find(filter)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        sessions: sessions.map((s) => ({
          sessionId: String(s._id),
          userId: s.userId,
          title: s.title,
          source: s.source,
          lastMessageAt: s.lastMessageAt,
          createdAt: s.createdAt
        })),
        pagination: {
          page,
          limit,
          totalSessions: total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch sessions.' });
  }
});

router.get('/admin/messages/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
    const skip = (page - 1) * limit;

    const session = await AssistantChatSession.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    const total = await AssistantChatMessage.countDocuments({ sessionId });
    const messages = await AssistantChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        session: {
          sessionId: String(session._id),
          userId: session.userId,
          title: session.title,
          source: session.source,
          lastMessageAt: session.lastMessageAt,
          createdAt: session.createdAt
        },
        messages: messages.map((m) => ({
          id: String(m._id),
          role: m.role,
          content: m.content,
          metadata: m.metadata || {},
          createdAt: m.createdAt
        })),
        pagination: {
          page,
          limit,
          totalMessages: total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch messages.' });
  }
});

router.get('/admin/user/:userId/messages', async (req, res) => {
  try {
    const userId = normalizeSpace(req.params.userId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 50, 200));
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required.' });
    }

    const total = await AssistantChatMessage.countDocuments({ userId });
    const messages = await AssistantChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        userId,
        messages: messages.reverse().map((m) => ({
          id: String(m._id),
          sessionId: String(m.sessionId),
          role: m.role,
          content: m.content,
          metadata: m.metadata || {},
          createdAt: m.createdAt
        })),
        pagination: {
          page,
          limit,
          totalMessages: total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch user messages.' });
  }
});

module.exports = router;
