// Helpers behind the MCQ practice API: option shuffling, answer scoring and
// the shape questions take on their way to the app. Kept free of Express and
// Mongo so the rules can be reasoned about (and tested) on their own.

const { getPurchasedContentIds } = require('./purchaseGating');

const PURCHASE_MODULE = 'mcq';

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// The option numbers a question actually offers (3 and 4 are optional).
function availableOptionKeys(question) {
  return [1, 2, 3, 4].filter((k) => {
    const text = question[`option${k}`];
    return text !== undefined && text !== null && String(text).trim() !== '';
  });
}

function optionText(question, key) {
  return question[`option${key}`] || '';
}

// Answers arrive from the app as option numbers; normalise to a clean,
// de-duplicated, sorted list of valid keys so comparison is reliable.
function normalizeSelected(selected, question) {
  const valid = new Set(availableOptionKeys(question));
  const nums = (Array.isArray(selected) ? selected : [selected])
    .map((n) => parseInt(n, 10))
    .filter((n) => !Number.isNaN(n) && valid.has(n));
  return [...new Set(nums)].sort((a, b) => a - b);
}

function sameAnswerSet(a = [], b = []) {
  const x = [...new Set(a)].sort((m, n) => m - n);
  const y = [...new Set(b)].sort((m, n) => m - n);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

// A multi-answer question only counts as correct when every correct option is
// chosen and nothing else is; partial selections are wrong.
function isAnswerCorrect(selected, correctAnswers) {
  if (!selected || !selected.length) return false;
  return sameAnswerSet(selected, correctAnswers);
}

// The question as the app sees it while playing: no answer key attached.
function toPlayableQuestion(question, { sequence, optionOrder }) {
  const order = optionOrder && optionOrder.length ? optionOrder : availableOptionKeys(question);
  return {
    sequence,
    question_id: question.id,
    _id: question._id,
    question_html: question.question || '',
    image: question.image || '',
    multi_select: (question.correctAnswers || []).length > 1,
    options: order.map((key) => ({ key, text: optionText(question, key) })),
  };
}

// The same question after the attempt is finished, with the key revealed.
function toReviewQuestion(question, row) {
  const order = row.option_order && row.option_order.length ? row.option_order : availableOptionKeys(question);
  return {
    sequence: row.sequence,
    question_id: row.question_id,
    _id: question ? question._id : row.question,
    question_html: question ? question.question || '' : '',
    image: question ? question.image || '' : '',
    multi_select: (row.correct_answers || []).length > 1,
    options: question ? order.map((key) => ({ key, text: optionText(question, key) })) : [],
    selected: row.selected || [],
    correct_answers: row.correct_answers || [],
    answered: !!row.answered,
    is_correct: row.is_correct,
    explanation: question ? question.explanation || '' : '',
    references: question ? question.references || [] : [],
    time_taken_sec: row.time_taken_sec || 0,
  };
}

// Recomputes the tallies on an attempt from its answer rows.
function tallyAttempt(attempt) {
  const total = attempt.questions.length;
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  attempt.questions.forEach((q) => {
    if (!q.answered || !(q.selected || []).length) skipped += 1;
    else if (q.is_correct) correct += 1;
    else wrong += 1;
  });
  return {
    total,
    correct,
    wrong,
    skipped,
    score: correct,
    percent: total ? Math.round((correct / total) * 1000) / 10 : 0,
    time_taken_sec: attempt.questions.reduce((sum, q) => sum + (q.time_taken_sec || 0), 0),
  };
}

/**
 * Marks paid quiz sets as locked unless the user has bought them.
 * Purchases are recorded against email/phone (the existing Purchase model),
 * while practice history is keyed by user_id.
 */
async function gateSets(sets, { email, phone }) {
  const hasPaid = sets.some((s) => s.payment);
  const purchased = hasPaid ? await getPurchasedContentIds(PURCHASE_MODULE, email, phone) : new Set();
  return sets.map((set) => {
    const locked = !!set.payment && !purchased.has(String(set.id));
    return { ...set, payment: !!set.payment, amount: set.amount || 0, locked, purchased: !locked };
  });
}

async function isSetUnlocked(set, { email, phone }) {
  if (!set.payment) return true;
  const purchased = await getPurchasedContentIds(PURCHASE_MODULE, email, phone);
  return purchased.has(String(set.id));
}

module.exports = {
  PURCHASE_MODULE,
  shuffle,
  availableOptionKeys,
  optionText,
  normalizeSelected,
  sameAnswerSet,
  isAnswerCorrect,
  toPlayableQuestion,
  toReviewQuestion,
  tallyAttempt,
  gateSets,
  isSetUnlocked,
};
