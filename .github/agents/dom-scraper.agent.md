# DOM & Scraping Extractors
Your task is to refactor brittle HTML and text extraction logic (like raw strings and regex loops) using `cheerio` on the server and `@mozilla/readability` in the Chrome Extension.

Focus areas:
- `app/lib/archive.ts`, `app/lib/recipe-cleaner.ts`
- `chrome-extension/utils.ts`
- Implement parse boundaries cleanly and efficiently with caching where appropriate.