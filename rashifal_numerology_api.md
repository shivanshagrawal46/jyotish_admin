## Rashifal & Numerology API – Frontend Documentation

Assuming backend base URL is something like `https://your-domain.com`. All responses are JSON and follow:

- **Success**: `{ success: true, data: ... }` (sometimes plus extra fields like `year`, `month`, `message`)
- **Error**: `{ success: false, error: "Message" }`

`dateId`, `contentId`, `yearId`, and `month` often accept either:
- A **numeric index** (1-based, e.g. `1`, `2`, `3`), or  
- A **MongoDB `_id` string** (for advanced usage).

---

## Rashifal API (base: `/api/rashifal`)

### Daily Rashifal

- **GET** `/api/rashifal/daily`  
  - **Description**: Get list of all daily rashifal dates (with sequential `id`).
  - **Response** (example):

    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "_id": "...",
          "dateLabel": "01 Jan 2025",
          "dateISO": "2025-01-01",
          "notes": "...",
          "sequence": 1,
          "createdAt": "...",
          "updatedAt": "..."
        }
      ]
    }
    ```

- **POST** `/api/rashifal/daily`  
  - **Description**: Create a new daily date (admin UI).
  - **Body**:

    ```json
    {
      "dateLabel": "01 Jan 2025",
      "dateISO": "2025-01-01",
      "notes": "optional"
    }
    ```

- **PUT** `/api/rashifal/daily/:dateId`  
  - **Description**: Update a daily date by `dateId` (numeric index or `_id`).
  - **Body**: any subset of `{ "dateLabel", "dateISO", "notes", "sequence" }`.

- **DELETE** `/api/rashifal/daily/:dateId`  
  - **Description**: Delete a date and **all its contents**.

- **DELETE** `/api/rashifal/daily`  
  - **Description**: Bulk delete multiple dates and their contents.
  - **Body**:

    ```json
    {
      "dateIds": ["<mongo-id-1>", "<mongo-id-2>"]
    }
    ```

- **GET** `/api/rashifal/daily/:dateId`  
  - **Description**: Get **all rashifal contents** for a date.
  - **Params**:
    - `dateId`: numeric index (1, 2, 3, …) or date `_id`.
  - **Response**:

    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "_id": "...",
          "title_hn": "...",
          "title_en": "...",
          "details_hn": "...",
          "details_en": "...",
          "images": ["url1", "url2"],
          "sequence": 1,
          "dateRef": "...",
          "createdAt": "...",
          "updatedAt": "..."
        }
      ]
    }
    ```

- **POST** `/api/rashifal/daily/:dateId`  
  - **Description**: Create one rashifal content under a specific date.
  - **Body**:

    ```json
    {
      "sequence": 1,
      "title_hn": "हिंदी शीर्षक",
      "title_en": "English Title",
      "details_hn": "हिंदी विवरण",
      "details_en": "English details",
      "images": ["https://.../img1.jpg", "https://.../img2.jpg"]
    }
    ```

- **GET** `/api/rashifal/daily/:dateId/:contentId`  
  - **Description**: Get a **single** content item for a date.
  - **Params**:
    - `contentId` can be:
      - Numeric index (1-based within that date), or
      - Content `_id`.

- **PUT** `/api/rashifal/daily/:dateId/:contentId`  
  - **Description**: Update a specific content item.
  - **Body**: any subset of content fields; `images` can be array or comma-separated string.

- **DELETE** `/api/rashifal/daily/:dateId/:contentId`  
  - **Description**: Delete a specific content item.

---

### Monthly Rashifal

- **GET** `/api/rashifal/months`  
  - **Description**: List all years that have monthly rashifal.

- **GET** `/api/rashifal/months/:yearId`  
  - **Description**: For a given year, get the 12 months and their `contentCount`.
  - **Params**:
    - `yearId`: numeric `id` or year `_id`.

- **GET** `/api/rashifal/months/:yearId/:month`  
  - **Description**: Get all rashifal content for a specific month of a year.
  - **Params**:
    - `yearId`: numeric or `_id`
    - `month`: either month **name** (`January`) or **number** (`1`–`12`).

- **GET** `/api/rashifal/months/:yearId/:month/:contentId`  
  - **Description**: Get one specific content item from that month.
  - **Params**:
    - `contentId`: numeric index inside that month or content `_id`.

---

### Yearly Rashifal

- **GET** `/api/rashifal/yearly`  
  - **Description**: Get list of years for yearly rashifal.

- **GET** `/api/rashifal/yearly/:yearId`  
  - **Description**: Get all yearly rashifal content for a given year.
  - **Params**:
    - `yearId`: numeric `id` or `_id`.

---

## Numerology API (base: `/api/numerology`)

The numerology endpoints mirror rashifal almost exactly, just with numerology models.

### Daily Numerology

- **GET** `/api/numerology/daily`  
  - **Description**: List all daily numerology dates (with sequential `id`).

- **POST** `/api/numerology/daily`  
  - **Description**: Create a new numerology date.

- **PUT** `/api/numerology/daily/:dateId`  
- **DELETE** `/api/numerology/daily/:dateId`  
- **DELETE** `/api/numerology/daily` (bulk; body `{ "dateIds": [...] }`)

- **GET** `/api/numerology/daily/:dateId`  
  - **Description**: Get all numerology contents for a date.

- **POST** `/api/numerology/daily/:dateId`  
  - **Description**: Create one numerology content entry.

- **GET** `/api/numerology/daily/:dateId/:contentId`  
- **PUT** `/api/numerology/daily/:dateId/:contentId`  
- **DELETE** `/api/numerology/daily/:dateId/:contentId`  
  - **Description**: Read/update/delete a single content item; `contentId` can be index or `_id`.

---

### Monthly Numerology

- **GET** `/api/numerology/months`  
  - **Description**: List all years for monthly numerology.

- **GET** `/api/numerology/months/:yearId`  
  - **Description**: Get 12 months with `contentCount` for a given year.

- **GET** `/api/numerology/months/:yearId/:month`  
  - **Description**: Get all numerology contents for that month of that year.  

- **GET** `/api/numerology/months/:yearId/:month/:contentId`  
  - **Description**: Get a single monthly numerology content item.

---

### Yearly Numerology

- **GET** `/api/numerology/yearly`  
  - **Description**: Get list of yearly numerology years.

- **GET** `/api/numerology/yearly/:yearId`  
  - **Description**: Get yearly numerology content for a specific year.


