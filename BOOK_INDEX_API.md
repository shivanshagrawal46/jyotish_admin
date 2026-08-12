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

Because `chars_per_page` is a parameter, an app with a larger font can request
its own pagination (`?chars_per_page=1200`) and get a consistent set of numbers
for that layout.

### Example

```
GET /api/book/index/2?flat=1
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
            "amount": 0
          }
        ]
      }
    ],
    "flat": [
      { "type": "chapter", "level": 0, "label": "7-वर्गविवेचनाध्‍याय", "chapter_no": 6, "page": 6 },
      { "type": "topic", "level": 1, "label": "लग्‍न व होरा से क्‍या देखें", "chapter_no": 6, "topic_no": 1, "page": 6, "payment": false }
    ]
  }
}
```

### Errors

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `400`  | `:bookId` is neither a number nor an `_id` |
| `404`  | No book with that id                       |

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
- Paid topics are listed in the index like any other, with `payment` and `amount`
  included, so the app can show a lock icon next to them. Only the body text is
  gated, by the existing content endpoints.
- Topics whose title fields are all empty appear as `"Untitled"`. That indicates
  missing data for that record, which can be fixed in the admin panel.
- The logic lives in `services/bookIndex.js` and takes its models as arguments,
  so the same index can be exposed for Granths by passing `GranthChapter` and
  `GranthContent`.
