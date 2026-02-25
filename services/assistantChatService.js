const https = require('https');
const mongoose = require('mongoose');
const AssistantChatSession = require('../models/AssistantChatSession');
const AssistantChatMessage = require('../models/AssistantChatMessage');
const { searchAppContent } = require('./assistantSearchService');

const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4.1-nano';
const MAX_CONTEXT_MESSAGES = 5;
const MAX_OPENAI_CALLS_PER_QUESTION = 1;
const REDIRECT_MESSAGE =
  'For personalized kundli analysis, please consult Samta AI or Guruji inside the app.';

const SYSTEM_PROMPT = `
You are Astro Assistant, an AI helper inside an astrology mobile application.

The user may speak in English, Hindi, or Hinglish. Understand intent in all three.
Reply in the same language as the user whenever possible.

Rules:
1) APP DATA
- Backend already searched the app database and provided APP_SEARCH_CONTEXT.
- If user asks for in-app data (rashifal, zodiac predictions in app content, learning content, app information),
  answer ONLY from APP_SEARCH_CONTEXT.
- Never invent app data.
- If APP_SEARCH_CONTEXT has no relevant data for app-data query, clearly say it is not available in app database.
- Return only the relevant part; do not dump unnecessary data.

2) GENERAL ASTROLOGY KNOWLEDGE
- If the user asks general educational astrology questions, answer simply.
- Do NOT provide personal predictions.

3) PERSONAL KUNDLI/FUTURE REQUESTS (STRICT BLOCK)
- If user asks personal kundli, marriage timing, career prediction, future prediction, or personal horoscope analysis,
  always reply exactly:
  "${REDIRECT_MESSAGE}"

4) SAFETY
- Never assume birth details.
- Never bypass redirect.
- If uncertain, choose redirect.
- Keep responses concise and polite.
`.trim();

const PERSONAL_PREDICTION_PATTERNS = [
  /kundli/i,
  /birth chart/i,
  /personal horoscope/i,
  /future prediction/i,
  /predict my future/i,
  /marriage timing/i,
  /career prediction/i,
  /will i marry/i,
  /mera future/i,
  /meri shaadi/i,
  /shaadi kab/i,
  /meri kundli/i,
  /मेरा भविष्य/i,
  /मेरी शादी/i,
  /कुंडली/i,
  /भविष्यवाणी/i
];

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseJsonSafely(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function isPersonalPredictionRequest(message) {
  const text = normalizeSpace(message);
  if (!text) return false;
  return PERSONAL_PREDICTION_PATTERNS.some((pattern) => pattern.test(text));
}

function isLikelyAppDataQuery(message) {
  const text = normalizeSpace(message).toLowerCase();
  if (!text) return false;

  const appDataPatterns = [
    /rashifal/,
    /राशिफल/,
    /zodiac/,
    /today.*prediction/,
    /app (data|content|info|information)/,
    /learning content/,
    /granth/,
    /kosh/,
    /festival/,
    /muhurat/,
    /numerology/,
    /book/,
    /daily horoscope/,
    /monthly horoscope/,
    /yearly horoscope/
  ];

  return appDataPatterns.some((pattern) => pattern.test(text));
}

function buildAppSearchContext(searchResult, appDataLikely) {
  const compactHits = (searchResult.hits || []).slice(0, 10).map((hit) => ({
    model: hit.model,
    documentId: hit.documentId,
    snippets: hit.snippets
  }));

  return [
    'APP_SEARCH_CONTEXT:',
    JSON.stringify(
      {
        appDataLikely,
        found: !!searchResult.found,
        totalMatches: searchResult.totalMatches || 0,
        hits: compactHits
      },
      null,
      2
    ),
    'Instruction: Use only this context for app-data answers.'
  ].join('\n');
}

function buildSessionTitle(message) {
  const text = normalizeSpace(message);
  if (!text) return 'New Chat';
  return text.length <= 60 ? text : `${text.slice(0, 60)}...`;
}

function updateSessionActivity(sessionId) {
  return AssistantChatSession.findByIdAndUpdate(
    sessionId,
    { $set: { lastMessageAt: new Date() } },
    { new: false }
  );
}

async function getOrCreateSession(userId, sessionId, source, firstMessage) {
  if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
    const existing = await AssistantChatSession.findOne({ _id: sessionId, userId });
    if (existing) return existing;
  }

  return AssistantChatSession.create({
    userId,
    source: source === 'socket' ? 'socket' : 'api',
    title: buildSessionTitle(firstMessage)
  });
}

function saveChatMessage({ sessionId, userId, role, content, toolName = null, metadata = {} }) {
  return AssistantChatMessage.create({
    sessionId,
    userId,
    role,
    content,
    toolName,
    metadata
  });
}

async function fetchRecentContextMessages(sessionId, limit = MAX_CONTEXT_MESSAGES) {
  const docs = await AssistantChatMessage.find({ sessionId, role: { $in: ['user', 'assistant'] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return docs.reverse().map((doc) => ({
    role: doc.role,
    content: doc.content
  }));
}

function postJsonToOpenAI(pathname, payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing in environment.');
  }

  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: pathname,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          const parsed = parseJsonSafely(raw, null);
          if (res.statusCode >= 400) {
            const message =
              parsed?.error?.message || `OpenAI request failed with status ${res.statusCode}`;
            return reject(new Error(message));
          }
          if (!parsed) return reject(new Error('Invalid OpenAI response payload.'));
          resolve(parsed);
        });
      }
    );

    req.setTimeout(30000, () => {
      req.destroy(new Error('OpenAI request timeout.'));
    });

    req.on('error', (error) => reject(error));
    req.write(body);
    req.end();
  });
}

async function runOpenAI(messages, options = {}) {
  const guard = options.callGuard;
  if (!guard) {
    throw new Error('OpenAI call guard is required.');
  }
  guard.count += 1;
  if (guard.count > MAX_OPENAI_CALLS_PER_QUESTION) {
    throw new Error('OpenAI single-call policy violation: more than one AI call attempted.');
  }

  const payload = {
    model: MODEL_NAME,
    temperature: 0.2,
    max_tokens: options.maxTokens || 450,
    messages
  };

  return postJsonToOpenAI('/v1/chat/completions', payload);
}

async function generateAssistantReply(userMessage, recentMessages) {
  const callGuard = { count: 0 };
  const appDataLikely = isLikelyAppDataQuery(userMessage);
  const searchResult = await searchAppContent(userMessage, { limit: 12 });
  const searchContext = buildAppSearchContext(searchResult, appDataLikely);

  const inputMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: searchContext },
    ...recentMessages,
    { role: 'user', content: userMessage }
  ];

  const completion = await runOpenAI(inputMessages, { maxTokens: 450, callGuard });
  let finalReply = normalizeSpace(completion?.choices?.[0]?.message?.content);
  if (appDataLikely && !searchResult.found) {
    finalReply = 'This information is not available in the app database right now.';
  }

  return {
    reply: finalReply,
    usedSearch: true, // backend search is always executed before AI call
    searchFound: searchResult.found,
    searchQuery: userMessage,
    aiApiCalls: callGuard.count
  };
}

async function processAssistantChat({ userId, message, sessionId, source = 'api' }) {
  const normalizedUserId = normalizeSpace(userId);
  const normalizedMessage = normalizeSpace(message);

  if (!normalizedUserId) {
    throw new Error('userId is required.');
  }
  if (!normalizedMessage) {
    throw new Error('message is required.');
  }

  const session = await getOrCreateSession(
    normalizedUserId,
    sessionId,
    source,
    normalizedMessage
  );
  const recentMessages = await fetchRecentContextMessages(session._id, MAX_CONTEXT_MESSAGES);

  await saveChatMessage({
    sessionId: session._id,
    userId: normalizedUserId,
    role: 'user',
    content: normalizedMessage
  });

  if (isPersonalPredictionRequest(normalizedMessage)) {
    await saveChatMessage({
      sessionId: session._id,
      userId: normalizedUserId,
      role: 'assistant',
      content: REDIRECT_MESSAGE,
      metadata: { blockedByPolicy: true }
    });
    await updateSessionActivity(session._id);

    return {
      sessionId: String(session._id),
      reply: REDIRECT_MESSAGE,
      usedSearch: false,
      redirected: true
    };
  }

  const aiResult = await generateAssistantReply(normalizedMessage, recentMessages);
  const finalReply =
    normalizeSpace(aiResult.reply) || 'I am sorry, I could not process that right now.';

  await saveChatMessage({
    sessionId: session._id,
    userId: normalizedUserId,
    role: 'assistant',
    content: finalReply,
    metadata: {
      usedSearch: aiResult.usedSearch,
      searchFound: aiResult.searchFound,
      searchQuery: aiResult.searchQuery,
      aiApiCalls: aiResult.aiApiCalls
    }
  });

  await updateSessionActivity(session._id);

  return {
    sessionId: String(session._id),
    reply: finalReply,
    usedSearch: aiResult.usedSearch,
    aiApiCalls: aiResult.aiApiCalls,
    redirected: false
  };
}

module.exports = {
  processAssistantChat
};
