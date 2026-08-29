# MCQ Practice API (for the app)

Practice mode for users: browse quiz sets, play a session, get scored, review
mistakes, track progress and bookmark questions.

Base path: `/api/mcq/practice`. No authentication. Users are identified by a
`user_id` string (the same convention `SavedKundli` uses); paid sets are unlocked
with the `email` / `phone` the existing Purchase module records.

The older `/api/mcq/*` endpoints are unchanged and still work.

## How answers stay honest

`/start` returns the questions **without** the answer key and snapshots the
correct answers onto the attempt. Scoring happens on the server. A tampered
client can't inflate a score, and editing a question in the admin panel later
never rewrites a past result.

Options are shuffled but each carries a `key` holding its original option number
(1-4), so the client sends back `key` values and correctness never depends on
display order.

`question_html` may contain HTML (some questions are `<table>` markup) — render
it as rich text.

Only questions with `isActive: true` are ever served.

---

## Browsing

### `GET /categories`

Subjects for the practice home screen. `progress` is included only when
`user_id` is passed.

| Query     | Required | Notes                       |
| --------- | -------- | --------------------------- |
| `user_id` | no       | adds the user's progress    |

```json
{
  "success": true,
  "data": [
    {
      "id": 1, "_id": "682c...", "name": "फलित ज्योतिष", "introduction": "", "position": 1,
      "set_count": 5, "question_count": 47,
      "progress": { "answered": 40, "correct": 29, "accuracy": 72.5, "last_attempt_at": "2026-08-20T10:12:00.000Z" }
    }
  ]
}
```

### `GET /categories/:categoryId/sets`

Quiz sets in a subject. `:categoryId` is the numeric category id.

| Query               | Required | Notes                                    |
| ------------------- | -------- | ---------------------------------------- |
| `user_id`           | no       | adds `user_stats` per set                |
| `email` / `phone`   | no       | unlocks sets the user has bought         |

```json
{
  "success": true,
  "data": {
    "category": { "id": 1, "_id": "682c...", "name": "फलित ज्योतिष", "introduction": "" },
    "sets": [
      {
        "id": 1, "_id": "682d...", "name": "राशि परिचय", "introduction": "", "position": 1,
        "question_count": 10,
        "payment": false, "amount": 0, "locked": false, "purchased": true,
        "user_stats": { "attempts": 2, "best_score": 8, "best_percent": 80, "last_attempt_at": "2026-08-20T10:12:00.000Z" }
      }
    ]
  }
}
```

---

## Playing a session

### `POST /start`

```json
{
  "user_id": "device-or-user-123",
  "set_id": 1,
  "mode": "practice",
  "question_count": 10,
  "shuffle_questions": true,
  "shuffle_options": true,
  "email": "buyer@example.com"
}
```

| Field                              | Required | Notes                                                              |
| ---------------------------------- | -------- | ------------------------------------------------------------------ |
| `user_id`                          | **yes**  |                                                                     |
| `set_id`                           | one of   | practise a single quiz set (numeric id)                            |
| `category_id`                      | one of   | mixed quiz across all unlocked sets in the subject                 |
| `source`                           | one of   | `"wrong"` or `"bookmarked"` to revise                              |
| `mode`                             | no       | `practice` (default) or `test`                                     |
| `question_count`                   | no       | defaults to everything available; hard cap 100                     |
| `shuffle_questions` / `shuffle_options` | no  | default `true`                                                     |
| `email` / `phone`                  | no       | required to open a paid set                                        |

Returns `201`:

```json
{
  "success": true,
  "data": {
    "attempt_id": "66d0a1f4c2b39e0012ab34cd",
    "mode": "practice", "source": "set",
    "set": { "id": 1, "name": "राशि परिचय", "category": { "id": 1, "name": "फलित ज्योतिष" } },
    "category": { "id": 1, "name": "फलित ज्योतिष" },
    "total_questions": 5,
    "started_at": "2026-08-29T09:30:00.000Z",
    "excluded_locked_sets": [],
    "questions": [
      {
        "sequence": 1,
        "question_id": 3,
        "_id": "68a1...",
        "question_html": "<table cellspacing=\"0\">…</table>",
        "image": "",
        "multi_select": false,
        "options": [
          { "key": 2, "text": "जन्म वर्ष से" },
          { "key": 1, "text": "जन्म माह से" },
          { "key": 4, "text": "नाम से" },
          { "key": 3, "text": "जन्म तिथि से" }
        ]
      }
    ]
  }
}
```

`multi_select` tells the UI to show checkboxes rather than radio buttons. For a
mixed `category_id` quiz, any locked sets are skipped and listed in
`excluded_locked_sets` so the app can offer them for sale.

**Locked set → `402`:**

```json
{
  "success": false,
  "message": "This quiz set is locked. Purchase it to practise.",
  "data": { "set": { "id": 1, "name": "राशि परिचय", "amount": 99 }, "module": "mcq" }
}
```

Record the purchase with the existing `POST /api/purchase` using
`{ "module": "mcq", "contentId": "<set id>", "email": "...", "amount": 99 }`.

### `POST /answer`

One answer at a time. `selected` is an array of option keys; send `[]` to skip.

```json
{ "attempt_id": "66d0…", "question_id": 3, "selected": [3], "time_taken_sec": 12 }
```

In `practice` mode the response reveals the outcome:

```json
{
  "success": true,
  "data": {
    "question_id": 3,
    "selected": [3],
    "is_correct": true,
    "correct_answers": [3],
    "explanation": "<p>…</p>",
    "references": [],
    "progress": { "answered": 1, "total": 5, "correct_so_far": 1 }
  }
}
```

In `test` mode the answer is recorded but `is_correct` comes back `null` and
`correct_answers` / `explanation` are omitted entirely.

A question with several correct options only counts as correct when the user
picks **exactly** that set — partial selections are wrong.

### `POST /submit`

Finishes the attempt and returns the scorecard. Answers may be sent in bulk here
instead of one at a time, which suits an app that works offline.

```json
{
  "attempt_id": "66d0…",
  "answers": [ { "question_id": 7, "selected": [2], "time_taken_sec": 20 } ],
  "time_taken_sec": 240
}
```

```json
{
  "success": true,
  "data": {
    "attempt_id": "66d0…",
    "mode": "practice", "source": "set", "status": "completed",
    "score": 2, "total": 5, "percent": 40,
    "correct": 2, "wrong": 1, "skipped": 2,
    "time_taken_sec": 43,
    "started_at": "…", "finished_at": "…",
    "review": [
      {
        "sequence": 1, "question_id": 3, "_id": "68a1…",
        "question_html": "…", "image": "", "multi_select": false,
        "options": [ { "key": 1, "text": "जन्म माह से" }, { "key": 3, "text": "जन्म तिथि से" } ],
        "selected": [3], "correct_answers": [3],
        "answered": true, "is_correct": true,
        "explanation": "<p>…</p>", "references": [], "time_taken_sec": 12
      }
    ]
  }
}
```

Submitting an already-finished attempt returns `409`.

---

## History, progress, revision

### `GET /attempts?user_id=U1&page=1&limit=20`

Past attempts, newest first. `status=in_progress` lists unfinished sessions
instead (handy for "resume where you left off"). Each row is a summary
(`attempt_id`, `set`, `category`, `mode`, `score`, `total`, `percent`,
`correct`, `wrong`, `skipped`, `time_taken_sec`, `started_at`, `finished_at`)
alongside the usual `pagination` block.

### `GET /attempts/:attemptId`

The full review of one attempt — same shape as the `submit` response, plus `set`
and `category`. Use it for a "see solutions" screen.

### `GET /stats?user_id=U1`

```json
{
  "success": true,
  "data": {
    "totals": { "attempts": 12, "answered": 118, "correct": 91, "time_spent_sec": 4820, "accuracy": 77.1 },
    "streak_days": 3,
    "by_category": [ { "id": 1, "name": "फलित ज्योतिष", "answered": 60, "correct": 48, "accuracy": 80 } ],
    "weakest_sets": [ { "id": 7, "name": "दशा", "answered": 12, "correct": 5, "accuracy": 41.7 } ],
    "counts": { "wrong_available": 27, "bookmarked": 9 }
  }
}
```

`streak_days` counts consecutive days ending today (or yesterday, so a streak
isn't broken until a day is actually missed). `counts` powers the
"Revise 27 wrong answers" button, which just calls `/start` with
`source: "wrong"`. Only the user's **most recent** answer to a question counts,
so a question drops out of the wrong pool once they get it right.

### `POST /bookmark`

```json
{ "user_id": "U1", "question_id": 3, "bookmarked": true }
```

Omit `bookmarked` to toggle. Responds with
`{ "question_id": 3, "bookmarked": true, "total_bookmarks": 9 }`.

### `GET /bookmarks?user_id=U1&page=1&limit=20`

Saved questions with their options, `correct_answers`, `explanation`,
`references` and `bookmarked_at` — this is a revision list, so the answers are
included.

---

## Errors

| Status | When                                                                  |
| ------ | --------------------------------------------------------------------- |
| `400`  | missing `user_id`, no selection given, or a malformed id              |
| `402`  | the quiz set is paid and this user hasn't bought it                   |
| `404`  | unknown category / set / attempt, or nothing available to practise    |
| `409`  | the attempt was already submitted                                     |

Errors are `{ "success": false, "message": "..." }`; the `402` also carries the
set and its price.

---

## Admin side

Quiz sets gained two fields, editable under **MCQ Masters** in the React admin:
`payment` (Paid Quiz Set) and `amount`, with the price shown only when the
toggle is on. A set left free behaves exactly as before.

New collections: `mcqattempts` (one document per session, holding the answer key
snapshot and every answer) and `mcqbookmarks` (unique per user + question).
