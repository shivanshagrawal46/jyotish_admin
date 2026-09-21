# Book Index API (Table of Contents with Page Numbers)

Returns a printed-book style index for a book: every chapter, the topics inside
each chapter, and the page number each one starts on.

**Page numbers are calculated automatically from the stored content.** Nobody
enters them in the admin panel, and there is no extra field to maintain. The same
content always produces the same page numbers, so a page number shown in the app
stays stable until the content itself is edited.

## Endpoint

```
GET /api/book/index/:bookId
```

`:bookId` accepts either the numeric book `id` (e.g. `2`) or the Mongo `_id`.

### Query parameters

| Parameter         | Default | Description                                                                 |
| ----------------- | ------- | --------------------------------------------------------------------------- |
| `flat`            | `0`     | `1` also returns a flat, ready-to-render index list (see `flat` below)      |
| `chars_per_page`  | `1800`  | Characters of text that fit on one page. Lower it for bigger fonts.         |
| `image_chars`     | `900`   | Vertical space one image is assumed to occupy, in "characters"              |
| `front_matter`    | `1`     | `0` skips the acknowledgement pages so chapter 1 starts on page 1           |
| `email`           | –       | Identifies the reader, so paid topics they own come back unlocked            |
| `phone`           | –       | Alternative identifier; either `email` or `phone` is enough                  |

Because `chars_per_page` is a parameter, an app with a larger font can request
its own pagination (`?chars_per_page=1200`) and get a consistent set of numbers
for that layout.

### Example

```
GET /api/book/index/2?flat=1&email=reader@example.com
```

```json
{
  "success": true,
  "data": {
    "book": {
      "id": 2,
      "_id": "68897b66fe2bb28de2f93a22",
      "name": "बृहत्पाराशरहोराशास्त्रम् (Brihatparashar)",
      "book_image": "/uploads/books/....jpg",
      "author": "",
      "publications": "",
      "isbn_no": "",
      "acknowledgement_title": "",
      "category": { "_id": "...", "id": 4, "name": "..." }
    },
    "total_pages": 140,
    "total_chapters": 23,
    "total_topics": 358,
    "skipped_empty_topics": 0,
    "purchase": {
      "identified": true,
      "paid_topics": 12,
      "purchased_topics": 3,
      "locked_topics": 9,
      "locked_amount": 441
    },
    "settings": { "chars_per_page": 1800, "image_chars": 900 },
    "front_matter": [],
    "chapters": [
      {
        "_id": "...",
        "id": 12,
        "chapter_no": 6,
        "name": "7-वर्गविवेचनाध्‍याय",
        "page": 6,
        "start_page": 6,
        "end_page": 11,
        "page_count": 6,
        "topic_count": 14,
        "paid_topic_count": 2,
        "locked_topic_count": 1,
        "topics": [
          {
            "_id": "...",
            "topic_no": 1,
            "sequence": 1,
            "title": "लग्‍न व होरा से क्‍या देखें",
            "title_hn": "लग्‍न व होरा से क्‍या देखें",
            "title_en": "",
            "title_hinglish": "",
            "page": 6,
            "start_page": 6,
            "end_page": 6,
            "page_count": 1,
            "payment": false,
            "amount": 0,
            "content_id": "68897b66fe2bb28de2f93a31",
            "locked": false,
            "purchased": true
          }
        ]
      }
    ],
    "flat": [
      { "type": "chapter", "level": 0, "label": "7-वर्गविवेचनाध्‍याय", "chapter_no": 6, "page": 6 },
      { "type": "topic", "level": 1, "label": "लग्‍न व होरा से क्‍या देखें", "chapter_no": 6, "topic_no": 1, "page": 6, "payment": false, "amount": 0, "locked": false, "purchased": true, "content_id": "68897b66fe2bb28de2f93a31" }
    ]
  }
}
```

### Errors

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `400`  | `:bookId` is neither a number nor an `_id` |
| `404`  | No book with that id                       |

## Paid topics and purchases

Books use the same paid-content mechanism as Kosh, through the shared
`/api/purchase` endpoints with `module: "book"`. The index reports the lock
state so the app can draw a lock icon and a price without a second round trip.

Per topic (and on each `flat` topic row):

| Field        | Meaning                                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `payment`    | The topic is paid content                                                   |
| `amount`     | Its price                                                                   |
| `content_id` | What to send as `contentId` when recording the purchase (the topic's `_id`) |
| `locked`     | The body is withheld for this caller — `payment && !purchased`              |
| `purchased`  | The caller may read it: free topics, and paid topics they have bought       |

Chapters carry `paid_topic_count` and `locked_topic_count`, and the book-level
`purchase` block summarises the whole book:

| Field               | Meaning                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `identified`        | `false` when no `email`/`phone` was sent — every paid topic reads as locked |
| `paid_topics`       | Paid topics in the book                                                |
| `purchased_topics`  | Of those, how many this caller owns                                    |
| `locked_topics`     | Still locked                                                           |
| `locked_amount`     | Total price of what is still locked — an "unlock all" figure           |

Without `email` or `phone` the index is still returned in full; paid topics just
come back `locked: true` with `identified: false`, which is the right display for
a reader who is not signed in. Page numbers never depend on who is asking.

### Recording a purchase

```
POST /api/purchase
x-purchase-key: <PURCHASE_API_KEY, when configured>

{
  "module": "book",
  "email": "reader@example.com",
  "contentId": "68897b66fe2bb28de2f93a31",
  "amount": 49,
  "reference": "<receipt id from the payment backend>"
}
```

The call is idempotent per (identifier + content), so re-posting the same
purchase is safe. `GET /api/purchase?module=book&email=...` lists the ids a user
owns. Payment itself is taken on the external payment backend; this only records
the entitlement — exactly as `/api/kosh-purchase` does for Kosh.

The body of a paid topic is served, once bought, by the existing content
endpoints, which take the same `email`/`phone` parameters:

```
GET /api/book/category/:categoryId/:nameId/:chapterId?email=...
GET /api/book/category/:categoryId/:nameId/:chapterId/:contentId?email=...
```

## How the page numbers are worked out

The book is walked in reading order — chapters by their `id`, topics by
`sequence` then creation time — while a cursor keeps track of the current page
and how full it is:

1. Rich text is stripped to plain text and measured. A topic's size is its title,
   `meaning`, `details` and `extra`, plus `image_chars` for each image and a small
   allowance for its heading.
2. Each chapter opens on a fresh page, the way a printed chapter does.
3. Topics flow on from one another, so several short topics share a page rather
   than each wasting one.
4. A topic never starts in the last ~200 characters of a page; it moves to the
   next page instead, which avoids a heading stranded at the very bottom.
5. Content rows with no title, no body and no images are placeholders left over
   from imports. They are left out of the index and consume no pages; the count
   is reported as `skipped_empty_topics`.

`page` is the page a chapter or topic **starts** on — the number you print in an
index. `start_page`, `end_page` and `page_count` describe its full span, which is
useful for a progress indicator or a "page X of Y" label while reading.

## Notes

- A chapter with no content yet still occupies its opening page, so page numbers
  don't shift once topics are added to it later.
- Paid topics are listed in the index like any other, with `payment`, `amount`
  and `locked` included, so the app can show a lock icon next to them. Only the
  body text is gated, by the existing content endpoints.
- Topics whose title fields are all empty appear as `"Untitled"`. That indicates
  missing data for that record, which can be fixed in the admin panel.
- The logic lives in `services/bookIndex.js` and takes its models as arguments,
  so the same index can be exposed for Granths by passing `GranthChapter` and
  `GranthContent`.
