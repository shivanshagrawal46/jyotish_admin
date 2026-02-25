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
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to process assistant chat.'
    });
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

module.exports = router;
