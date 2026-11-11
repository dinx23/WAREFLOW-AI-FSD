# WareFlow AI MERN Prototype

A responsive warehouse-operations prototype based on the WareFlow AI review deck. The interface keeps the deck’s teal-and-white design and covers dashboard, inventory, stock-out estimates, dynamic bin recommendations, security alerts, assistant actions, reports, and audit history.

## Run locally

Requirements: Node.js 20 or later and npm.

1. In this folder, run `npm install`.
2. Copy `.env.example` to `.env` if you want to configure MongoDB.
3. Run `npm run dev`.
4. Open `http://localhost:5173`.

The Vite dev server proxies `/api` calls to the Express API on port 5000. If MongoDB is not configured or is unavailable, the Express API starts with seeded in-memory demo data, so the app remains interactive. Data in memory resets when the API restarts. To persist demo edits, start MongoDB and set `MONGODB_URI` in `.env`; collections seed automatically when empty.

## Demo interactions

- Search and filter inventory by status, SKU, item, or bin.
- Adjust stock; the API records before/after values in the audit log.
- Approve suggested bin moves; approval status and an audit event update.
- Review security alerts and create sample reorder requests.
- Explore reports and audit history.

## Scope and status

The React screens and Express/Mongoose demo API are functional with seeded data. Stock-out estimates use a simple transparent rule based on sample on-hand quantity and average daily demand. The Python AI service described in the review deck, production authentication/roles, real warehouse integrations, model validation, testing and deployment are not implemented. Recommendations remain demonstrations and should be reviewed by an operator.
