# Advertisement API

Advertisements are banner carousels shown at fixed places in the app. Rules:

- Every **placement** holds at most **one** advertisement.
- One advertisement holds **many sections** (slides). Each section has an image, a title and an optional tap action: open any app content (Kosh, Karmkand, Book, Muhurat, Rashifal, Numerology, Festival, E-Magazine, YouTube), open a URL, or nothing.
- Content taps use the **same deep-link format as notifications**, so the app resolves them with the existing `GET /api/deep-link/resolve` endpoint.

Admin UI: React admin → Engagement → Advertisements.

---

## Placements

| Key | Where |
|---|---|
| `kundli` | Kundli screen |
| `kundli_match` | Kundli match screen |
| `panchang` | Panchang screen |
| `karmkand` | Karmkand section |
| `book` | Book section |
| `rashifal` | Rashifal section |
| `numerology` | Numerology section |
| `emagazine` | E-Magazine section |
| `kosh_cat:<categoryId>` | One placement **per Kosh category** (Mongo `_id` of the category) |

`GET /api/advertisements/placements` returns the full list, including one entry per Kosh category with its numeric id:

```json
{
  "success": true,
  "placements": [
    { "key": "kundli", "label": "Kundli", "group": "App", "placementType": "kundli", "placementRef": null },
    { "key": "kosh_cat:682f6f022a55e7d6c51e2e62", "label": "Kosh › Sanskrit", "group": "Kosh",
      "placementType": "kosh_cat", "placementRef": "682f6f022a55e7d6c51e2e62", "koshCategoryNumericId": 1 }
  ]
}
```

---

## Public endpoints (no auth)

### Get the live ad for one placement

```
GET /api/advertisements/active?placement=kundli
GET /api/advertisements/active?placement=kosh_cat:<categoryId>
GET /api/advertisements/active?koshCategoryId=<categoryId>            (shortcut for the line above)
```

`data` is `null` when the placement has no live ad (inactive, not started yet, or ended).

```json
{
  "success": true,
  "placement": "kundli",
  "data": {
    "_id": "6ab18b8aeeef76e31a58d65e",
    "placement": "kundli",
    "placementType": "kundli",
    "placementRef": null,
    "placementLabel": "Kundli",
    "title": "Diwali promo",
    "startsAt": null,
    "endsAt": null,
    "updatedAt": "2026-09-22T10:12:00.000Z",
    "sections": [
      {
        "_id": "6ab18b8aeeef76e31a58d65f",
        "title": "Learn the word Agni",
        "subtitle": "Kosh entry",
        "imageUrl": "/images/1758536000-agni.png",
        "linkType": "content",
        "actionUrl": null,
        "position": 0,
        "deepLink": {
          "contentType": "kosh",
          "categoryId": "682f6f022a55e7d6c51e2e62", "categoryName": "Sanskrit",
          "subCategoryId": "682f6f2b2a55e7d6c51e2e76", "subCategoryName": "first chapter",
          "level3Id": null, "level3Name": null,
          "contentId": "68d8f43459e7593b926a31fc", "contentTitle": "अग्नि",
          "deepLinkUrl": "jyotishapp://kosh/682f.../682f.../68d8...",
          "screen": "KoshContentDetail",
          "navigationParams": { "section": "kosh", "screen": "KoshContentDetail", "contentId": "68d8...", "categoryId": "682f...", "subCategoryId": "682f..." }
        }
      },
      { "_id": "…", "title": "Visit our site", "imageUrl": "/images/…", "linkType": "url", "actionUrl": "https://example.com", "deepLink": null, "position": 1 },
      { "_id": "…", "title": "Just a banner", "imageUrl": "/images/…", "linkType": "none", "actionUrl": null, "deepLink": null, "position": 2 }
    ]
  }
}
```

Sections are already sorted by `position`.

### Get every live ad at once (app start)

```
GET /api/advertisements/active
```

```json
{ "success": true, "count": 3, "data": { "kundli": { …ad… }, "panchang": { …ad… }, "kosh_cat:682f…": { …ad… } } }
```

### Tracking

```
POST /api/advertisements/:adId/impression            → counts one view of the ad
POST /api/advertisements/:adId/click/:sectionId      → counts one tap on a section
```

Both return `{ "success": true }`.

### Handling a tap in Flutter

```
switch (section.linkType) {
  case 'content': GET /api/deep-link/resolve?section=<deepLink.contentType>&contentId=<deepLink.contentId>
                  → open deepLink.screen with the resolved content + hierarchy (same as notification taps)
  case 'url':     launch section.actionUrl
  case 'none':    do nothing
}
```

---

## Admin endpoints (JWT: `Authorization: Bearer <token>`)

Base: `/api/admin/advertisements`

| Method | Path | Purpose |
|---|---|---|
| GET | `/placements` | All placements with `taken`, `adId`, `adTitle` |
| GET | `/?page=&limit=&search=&placementType=&placement=` | Paginated list |
| GET | `/:id` | One ad |
| POST | `/` | Create. `409` if the placement already has an ad |
| PUT | `/:id` | Replace fields and sections. `409` if the new placement belongs to another ad |
| POST | `/:id/toggle` | Flip `isActive` |
| DELETE | `/:id` | Delete |

Create / update body:

```json
{
  "placement": "kosh_cat:682f6f022a55e7d6c51e2e62",
  "title": "Diwali promo",
  "isActive": true,
  "startsAt": null,
  "endsAt": "2026-11-05T00:00:00.000Z",
  "sections": [
    {
      "title": "Learn the word Agni", "subtitle": "Kosh entry", "imageUrl": "/images/agni.png",
      "linkType": "content",
      "dl_contentType": "kosh",
      "dl_categoryId": "682f…", "dl_categoryName": "Sanskrit",
      "dl_subCategoryId": "682f…", "dl_subCategoryName": "first chapter",
      "dl_contentId": "68d8…", "dl_contentTitle": "अग्नि"
    },
    { "title": "Visit our site", "imageUrl": "/images/site.png", "linkType": "url", "actionUrl": "https://example.com" },
    { "title": "Just a banner", "imageUrl": "/images/banner.png", "linkType": "none" }
  ]
}
```

- `dl_*` fields are the same ones the notification form sends; the server builds `deepLink` from them.
- Section order in the array is the display order. Send a section's `_id` on update to keep its click count.
- Images come from the existing admin upload: `POST /api/admin/upload` (multipart `file`) → `{ "url": "/images/…" }`.
