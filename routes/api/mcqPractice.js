// MCQ practice API for the app (not the admin panel).
//
// The answer key never leaves the server while a session is being played:
// /start hands out shuffled questions without it, and scoring happens here from
// the copy snapshotted onto the attempt. Users are identified by `user_id`
// (the same convention SavedKundli uses); paid quiz sets are unlocked with the
// email/phone the Purchase module already records.
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const McqCategory = require('../../models/McqCategory');
const McqMaster = require('../../models/McqMaster');
const McqContent = require('../../models/McqContent');
const McqAttempt = require('../../models/McqAttempt');
const McqBookmark = require('../../models/McqBookmark');

const {
  shuffle,
  availableOptionKeys,
  normalizeSelected,
  isAnswerCorrect,
  toPlayableQuestion,
  toReviewQuestion,
  tallyAttempt,
  gateSets,
  isSetUnlocked,
} = require('../../services/mcqPractice');

const MAX_QUESTIONS = 100;

const str = (v) => (v == null ? '' : String(v).trim());
const fail = (res, code, message) => res.status(code).json({ success: false, message });

function pager(req, defaultLimit = 20) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

const meta = (page, limit, total) => ({
  currentPage: page,
  totalPages: Math.max(1, Math.ceil(total / limit)),
  totalItems: total,
  itemsPerPage: limit,
});

// Only live questions are ever practised.
const ACTIVE = { isActive: true };

// Per-user answer history, most recent answer per question wins.
async function latestAnswersByQuestion(userId) {
  const attempts = await McqAttempt.find({ user_id: userId, status: 'completed' })
    .select('questions finished_at')
    .sort({ finished_at: -1 })
    .lean();
  const seen = new Map();
  attempts.forEach((a) => {
    (a.questions || []).forEach((q) => {
      const key = String(q.question);
      if (!seen.has(key) && q.answered) seen.set(key, q);
    });
  });
  return seen;
}

async function userStatsByMaster(userId) {
  if (!userId) return new Map();
  const rows = await McqAttempt.aggregate([
    { $match: { user_id: userId, status: 'completed', master: { $ne: null } } },
    {
      $group: {
        _id: '$master',
        attempts: { $sum: 1 },
        best_score: { $max: '$score' },
        best_percent: { $max: '$percent' },
        last_attempt_at: { $max: '$finished_at' },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), r]));
}

// ---------------------------------------------------------------- browsing --

// GET /api/mcq/practice/categories
router.get('/categories', async (req, res) => {
  try {
    const userId = str(req.query.user_id);
    const categories = await McqCategory.find().sort({ position: 1 }).lean();

    const masters = await McqMaster.find().select('category').lean();
    const setCount = new Map();
    masters.forEach((m) => {
      const k = String(m.category);
      setCount.set(k, (setCount.get(k) || 0) + 1);
    });

    const questionRows = await McqContent.aggregate([
      { $match: ACTIVE },
      { $lookup: { from: 'mcqmasters', localField: 'master', foreignField: '_id', as: 'm' } },
      { $unwind: '$m' },
      { $group: { _id: '$m.category', n: { $sum: 1 } } },
    ]);
    const questionCount = new Map(questionRows.map((r) => [String(r._id), r.n]));

    let progress = new Map();
    if (userId) {
      const rows = await McqAttempt.aggregate([
        { $match: { user_id: userId, status: 'completed', category: { $ne: null } } },
        {
          $group: {
            _id: '$category',
            answered: { $sum: { $add: ['$correct', '$wrong'] } },
            correct: { $sum: '$correct' },
            last_attempt_at: { $max: '$finished_at' },
          },
        },
      ]);
      progress = new Map(rows.map((r) => [String(r._id), r]));
    }

    res.json({
      success: true,
      data: categories.map((c) => {
        const p = progress.get(String(c._id));
        return {
          id: c.id,
          _id: c._id,
          name: c.name,
          introduction: c.introduction || '',
          position: c.position,
          set_count: setCount.get(String(c._id)) || 0,
          question_count: questionCount.get(String(c._id)) || 0,
          progress: p
            ? {
                answered: p.answered,
                correct: p.correct,
                accuracy: p.answered ? Math.round((p.correct / p.answered) * 1000) / 10 : 0,
                last_attempt_at: p.last_attempt_at,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
  }
});

// GET /api/mcq/practice/categories/:categoryId/sets
router.get('/categories/:categoryId/sets', async (req, res) => {
  try {
    const category = await McqCategory.findOne({ id: parseInt(req.params.categoryId, 10) }).lean();
    if (!category) return fail(res, 404, 'Category not found');

    const sets = await McqMaster.find({ category: category._id }).sort({ position: 1 }).lean();
    const counts = await McqContent.aggregate([
      { $match: { ...ACTIVE, master: { $in: sets.map((s) => s._id) } } },
      { $group: { _id: '$master', n: { $sum: 1 } } },
    ]);
    const countBySet = new Map(counts.map((r) => [String(r._id), r.n]));

    const gated = await gateSets(sets, { email: req.query.email, phone: req.query.phone });
    const stats = await userStatsByMaster(str(req.query.user_id));

    res.json({
      success: true,
      data: {
        category: { id: category.id, _id: category._id, name: category.name, introduction: category.introduction || '' },
        sets: gated.map((s) => {
          const st = stats.get(String(s._id));
          return {
            id: s.id,
            _id: s._id,
            name: s.name,
            introduction: s.introduction || '',
            position: s.position,
            question_count: countBySet.get(String(s._id)) || 0,
            payment: s.payment,
            amount: s.amount,
            locked: s.locked,
            purchased: s.purchased,
            user_stats: st
              ? {
                  attempts: st.attempts,
                  best_score: st.best_score,
                  best_percent: st.best_percent,
                  last_attempt_at: st.last_attempt_at,
                }
              : null,
          };
        }),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching quiz sets', error: error.message });
  }
});

// ------------------------------------------------------------- the session --

// POST /api/mcq/practice/start
router.post('/start', async (req, res) => {
  try {
    const userId = str(req.body.user_id);
    if (!userId) return fail(res, 400, 'user_id is required');

    const mode = req.body.mode === 'test' ? 'test' : 'practice';
    const email = str(req.body.email);
    const phone = str(req.body.phone);
    const shuffleQuestions = req.body.shuffle_questions !== false;
    const shuffleOptions = req.body.shuffle_options !== false;

    let source = 'set';
    let category = null;
    let master = null;
    let questions = [];
    const excludedLockedSets = [];

    if (req.body.set_id !== undefined && req.body.set_id !== null && str(req.body.set_id) !== '') {
      master = await McqMaster.findOne({ id: parseInt(req.body.set_id, 10) }).lean();
      if (!master) return fail(res, 404, 'Quiz set not found');
      if (!(await isSetUnlocked(master, { email, phone }))) {
        return res.status(402).json({
          success: false,
          message: 'This quiz set is locked. Purchase it to practise.',
          data: { set: { id: master.id, name: master.name, amount: master.amount || 0 }, module: 'mcq' },
        });
      }
      category = await McqCategory.findById(master.category).lean();
      questions = await McqContent.find({ ...ACTIVE, master: master._id }).lean();
      source = 'set';
    } else if (str(req.body.source) === 'wrong' || str(req.body.source) === 'bookmarked') {
      source = str(req.body.source);
      let ids = [];
      if (source === 'wrong') {
        const answers = await latestAnswersByQuestion(userId);
        ids = [...answers.values()].filter((a) => a.is_correct === false).map((a) => a.question);
      } else {
        const marks = await McqBookmark.find({ user_id: userId }).select('question').lean();
        ids = marks.map((m) => m.question);
      }
      if (!ids.length) {
        return fail(res, 404, source === 'wrong' ? 'No wrong answers to revise yet' : 'No bookmarked questions yet');
      }
      questions = await McqContent.find({ ...ACTIVE, _id: { $in: ids } }).lean();
    } else if (req.body.category_id !== undefined && str(req.body.category_id) !== '') {
      source = 'category';
      category = await McqCategory.findOne({ id: parseInt(req.body.category_id, 10) }).lean();
      if (!category) return fail(res, 404, 'Category not found');
      const sets = await McqMaster.find({ category: category._id }).lean();
      const gated = await gateSets(sets, { email, phone });
      const playable = gated.filter((s) => !s.locked);
      gated.filter((s) => s.locked).forEach((s) => excludedLockedSets.push({ id: s.id, name: s.name, amount: s.amount }));
      if (!playable.length) return fail(res, 402, 'All quiz sets in this category are locked');
      questions = await McqContent.find({ ...ACTIVE, master: { $in: playable.map((s) => s._id) } }).lean();
    } else {
      return fail(res, 400, 'Provide set_id, category_id, or source ("wrong" | "bookmarked")');
    }

    if (!questions.length) return fail(res, 404, 'No active questions available for this selection');

    if (shuffleQuestions) questions = shuffle(questions);
    const requested = parseInt(req.body.question_count, 10);
    if (!Number.isNaN(requested) && requested > 0) {
      questions = questions.slice(0, Math.min(requested, MAX_QUESTIONS));
    } else {
      questions = questions.slice(0, MAX_QUESTIONS);
    }

    const rows = questions.map((q, idx) => {
      const keys = availableOptionKeys(q);
      return {
        question: q._id,
        question_id: q.id,
        sequence: idx + 1,
        option_order: shuffleOptions ? shuffle(keys) : keys,
        correct_answers: q.correctAnswers || [],
        selected: [],
        answered: false,
        is_correct: null,
        time_taken_sec: 0,
      };
    });

    const attempt = await McqAttempt.create({
      user_id: userId,
      email: email || null,
      phone: phone || null,
      category: category ? category._id : null,
      master: master ? master._id : null,
      source,
      mode,
      status: 'in_progress',
      questions: rows,
      total: rows.length,
      started_at: new Date(),
    });

    res.status(201).json({
      success: true,
      data: {
        attempt_id: attempt._id,
        mode,
        source,
        set: master
          ? { id: master.id, name: master.name, category: category ? { id: category.id, name: category.name } : null }
          : null,
        category: category ? { id: category.id, name: category.name } : null,
        total_questions: rows.length,
        started_at: attempt.started_at,
        excluded_locked_sets: excludedLockedSets,
        questions: questions.map((q, idx) =>
          toPlayableQuestion(q, { sequence: idx + 1, optionOrder: rows[idx].option_order })
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error starting practice', error: error.message });
  }
});

// POST /api/mcq/practice/answer
router.post('/answer', async (req, res) => {
  try {
    const attemptId = str(req.body.attempt_id);
    if (!mongoose.Types.ObjectId.isValid(attemptId)) return fail(res, 400, 'Valid attempt_id is required');

    const attempt = await McqAttempt.findById(attemptId);
    if (!attempt) return fail(res, 404, 'Attempt not found');
    if (attempt.status === 'completed') return fail(res, 409, 'This attempt has already been submitted');

    const questionId = parseInt(req.body.question_id, 10);
    const row = attempt.questions.find(
      (q) => q.question_id === questionId || String(q.question) === str(req.body.question_id)
    );
    if (!row) return fail(res, 404, 'That question is not part of this attempt');

    const question = await McqContent.findById(row.question).lean();
    if (!question) return fail(res, 404, 'Question no longer exists');

    const selected = normalizeSelected(req.body.selected, question);
    row.selected = selected;
    row.answered = true;
    row.is_correct = isAnswerCorrect(selected, row.correct_answers);
    row.time_taken_sec = Math.max(parseInt(req.body.time_taken_sec, 10) || 0, 0);

    Object.assign(attempt, tallyAttempt(attempt));
    await attempt.save();

    const answeredCount = attempt.questions.filter((q) => q.answered).length;
    const reveal = attempt.mode === 'practice';

    res.json({
      success: true,
      data: {
        question_id: row.question_id,
        selected,
        is_correct: reveal ? row.is_correct : null,
        correct_answers: reveal ? row.correct_answers : undefined,
        explanation: reveal ? question.explanation || '' : undefined,
        references: reveal ? question.references || [] : undefined,
        progress: {
          answered: answeredCount,
          total: attempt.questions.length,
          correct_so_far: reveal ? attempt.correct : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving answer', error: error.message });
  }
});

// Builds the scorecard + full review for a finished attempt.
async function buildResult(attempt) {
  const questions = await McqContent.find({ _id: { $in: attempt.questions.map((q) => q.question) } }).lean();
  const byId = new Map(questions.map((q) => [String(q._id), q]));
  return {
    attempt_id: attempt._id,
    user_id: attempt.user_id,
    mode: attempt.mode,
    source: attempt.source,
    status: attempt.status,
    score: attempt.score,
    total: attempt.total,
    percent: attempt.percent,
    correct: attempt.correct,
    wrong: attempt.wrong,
    skipped: attempt.skipped,
    time_taken_sec: attempt.time_taken_sec,
    started_at: attempt.started_at,
    finished_at: attempt.finished_at,
    review: attempt.questions
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((row) => toReviewQuestion(byId.get(String(row.question)), row)),
  };
}

// POST /api/mcq/practice/submit
router.post('/submit', async (req, res) => {
  try {
    const attemptId = str(req.body.attempt_id);
    if (!mongoose.Types.ObjectId.isValid(attemptId)) return fail(res, 400, 'Valid attempt_id is required');

    const attempt = await McqAttempt.findById(attemptId);
    if (!attempt) return fail(res, 404, 'Attempt not found');
    if (attempt.status === 'completed') return fail(res, 409, 'This attempt has already been submitted');

    // Answers may be sent in bulk here instead of one at a time.
    const bulk = Array.isArray(req.body.answers) ? req.body.answers : [];
    if (bulk.length) {
      const questions = await McqContent.find({ _id: { $in: attempt.questions.map((q) => q.question) } }).lean();
      const byNumericId = new Map(questions.map((q) => [q.id, q]));
      const byObjectId = new Map(questions.map((q) => [String(q._id), q]));
      bulk.forEach((ans) => {
        const row = attempt.questions.find(
          (q) => q.question_id === parseInt(ans.question_id, 10) || String(q.question) === str(ans.question_id)
        );
        if (!row) return;
        const question = byNumericId.get(row.question_id) || byObjectId.get(String(row.question));
        if (!question) return;
        const selected = normalizeSelected(ans.selected, question);
        row.selected = selected;
        row.answered = true;
        row.is_correct = isAnswerCorrect(selected, row.correct_answers);
        row.time_taken_sec = Math.max(parseInt(ans.time_taken_sec, 10) || 0, 0);
      });
    }

    Object.assign(attempt, tallyAttempt(attempt));
    attempt.status = 'completed';
    attempt.finished_at = new Date();
    const totalTime = parseInt(req.body.time_taken_sec, 10);
    if (!Number.isNaN(totalTime) && totalTime > 0) attempt.time_taken_sec = totalTime;
    await attempt.save();

    res.json({ success: true, data: await buildResult(attempt) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error submitting attempt', error: error.message });
  }
});

// ------------------------------------------------------ history and review --

// GET /api/mcq/practice/attempts
router.get('/attempts', async (req, res) => {
  try {
    const userId = str(req.query.user_id);
    if (!userId) return fail(res, 400, 'user_id is required');
    const { page, limit, skip } = pager(req);

    const filter = { user_id: userId, status: str(req.query.status) === 'in_progress' ? 'in_progress' : 'completed' };
    const [attempts, total] = await Promise.all([
      McqAttempt.find(filter)
        .select('mode source score total percent correct wrong skipped time_taken_sec started_at finished_at master category')
        .populate('master', 'id name')
        .populate('category', 'id name')
        .sort({ finished_at: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      McqAttempt.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: attempts.map((a) => ({
        attempt_id: a._id,
        mode: a.mode,
        source: a.source,
        set: a.master ? { id: a.master.id, name: a.master.name } : null,
        category: a.category ? { id: a.category.id, name: a.category.name } : null,
        score: a.score,
        total: a.total,
        percent: a.percent,
        correct: a.correct,
        wrong: a.wrong,
        skipped: a.skipped,
        time_taken_sec: a.time_taken_sec,
        started_at: a.started_at,
        finished_at: a.finished_at,
      })),
      pagination: meta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attempts', error: error.message });
  }
});

// GET /api/mcq/practice/attempts/:attemptId
router.get('/attempts/:attemptId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.attemptId)) return fail(res, 400, 'Invalid attempt id');
    const attempt = await McqAttempt.findById(req.params.attemptId)
      .populate('master', 'id name')
      .populate('category', 'id name');
    if (!attempt) return fail(res, 404, 'Attempt not found');

    const result = await buildResult(attempt);
    res.json({
      success: true,
      data: {
        ...result,
        set: attempt.master ? { id: attempt.master.id, name: attempt.master.name } : null,
        category: attempt.category ? { id: attempt.category.id, name: attempt.category.name } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching attempt', error: error.message });
  }
});

// GET /api/mcq/practice/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = str(req.query.user_id);
    if (!userId) return fail(res, 400, 'user_id is required');

    const attempts = await McqAttempt.find({ user_id: userId, status: 'completed' })
      .select('category master correct wrong total time_taken_sec finished_at')
      .populate('category', 'id name')
      .populate('master', 'id name')
      .lean();

    const totals = attempts.reduce(
      (acc, a) => {
        acc.attempts += 1;
        acc.answered += (a.correct || 0) + (a.wrong || 0);
        acc.correct += a.correct || 0;
        acc.time_spent_sec += a.time_taken_sec || 0;
        return acc;
      },
      { attempts: 0, answered: 0, correct: 0, time_spent_sec: 0 }
    );
    totals.accuracy = totals.answered ? Math.round((totals.correct / totals.answered) * 1000) / 10 : 0;

    const group = (keyFn) => {
      const map = new Map();
      attempts.forEach((a) => {
        const key = keyFn(a);
        if (!key) return;
        const cur = map.get(key.id) || { id: key.id, name: key.name, answered: 0, correct: 0 };
        cur.answered += (a.correct || 0) + (a.wrong || 0);
        cur.correct += a.correct || 0;
        map.set(key.id, cur);
      });
      return [...map.values()].map((r) => ({
        ...r,
        accuracy: r.answered ? Math.round((r.correct / r.answered) * 1000) / 10 : 0,
      }));
    };

    const byCategory = group((a) => (a.category ? { id: a.category.id, name: a.category.name } : null));
    const bySet = group((a) => (a.master ? { id: a.master.id, name: a.master.name } : null));

    // Consecutive days ending today (or yesterday) with at least one attempt.
    const days = new Set(attempts.filter((a) => a.finished_at).map((a) => new Date(a.finished_at).toDateString()));
    let streak = 0;
    const cursor = new Date();
    if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toDateString())) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const answers = await latestAnswersByQuestion(userId);
    const wrongAvailable = [...answers.values()].filter((a) => a.is_correct === false).length;
    const bookmarked = await McqBookmark.countDocuments({ user_id: userId });

    res.json({
      success: true,
      data: {
        totals,
        streak_days: streak,
        by_category: byCategory.sort((a, b) => b.answered - a.answered),
        weakest_sets: bySet.filter((s) => s.answered >= 1).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5),
        counts: { wrong_available: wrongAvailable, bookmarked },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error building stats', error: error.message });
  }
});

// ------------------------------------------------------------- bookmarking --

// POST /api/mcq/practice/bookmark
router.post('/bookmark', async (req, res) => {
  try {
    const userId = str(req.body.user_id);
    if (!userId) return fail(res, 400, 'user_id is required');

    const filters = [];
    const numeric = parseInt(req.body.question_id, 10);
    if (!Number.isNaN(numeric)) filters.push({ id: numeric });
    if (mongoose.Types.ObjectId.isValid(str(req.body.question_id))) filters.push({ _id: str(req.body.question_id) });
    if (!filters.length) return fail(res, 400, 'Valid question_id is required');

    const question = await McqContent.findOne({ $or: filters }).lean();
    if (!question) return fail(res, 404, 'Question not found');

    const wanted = req.body.bookmarked;
    const shouldBookmark =
      wanted === undefined ? !(await McqBookmark.exists({ user_id: userId, question: question._id })) : !!wanted;

    if (shouldBookmark) {
      await McqBookmark.updateOne(
        { user_id: userId, question: question._id },
        { $setOnInsert: { user_id: userId, question: question._id, question_id: question.id } },
        { upsert: true }
      );
    } else {
      await McqBookmark.deleteOne({ user_id: userId, question: question._id });
    }

    res.json({
      success: true,
      data: {
        question_id: question.id,
        bookmarked: shouldBookmark,
        total_bookmarks: await McqBookmark.countDocuments({ user_id: userId }),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating bookmark', error: error.message });
  }
});

// GET /api/mcq/practice/bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const userId = str(req.query.user_id);
    if (!userId) return fail(res, 400, 'user_id is required');
    const { page, limit, skip } = pager(req);

    const [marks, total] = await Promise.all([
      McqBookmark.find({ user_id: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      McqBookmark.countDocuments({ user_id: userId }),
    ]);

    const questions = await McqContent.find({ _id: { $in: marks.map((m) => m.question) } }).lean();
    const byId = new Map(questions.map((q) => [String(q._id), q]));

    res.json({
      success: true,
      data: marks
        .filter((m) => byId.has(String(m.question)))
        .map((m, idx) => {
          const q = byId.get(String(m.question));
          return {
            ...toPlayableQuestion(q, { sequence: skip + idx + 1 }),
            correct_answers: q.correctAnswers || [],
            explanation: q.explanation || '',
            references: q.references || [],
            bookmarked_at: m.createdAt,
          };
        }),
      pagination: meta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bookmarks', error: error.message });
  }
});

module.exports = router;
