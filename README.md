# NextStep — application tracker

A small single-user MERN app for jobs, internships, and freelance opportunities.

## Features

1. React dashboard with counts, search, status filters, and due/overdue follow-ups.
2. Forms to create, edit, and delete applications.
3. Express CRUD API with validation and MongoDB persistence through Mongoose.
4. Integration tests against an isolated MongoDB and a production build check.

Version one is for local personal use. Authentication, CSV export, and kanban views can be added later. Add authentication and authorization before exposing it publicly.

## Run locally

Requires Node.js 22+ and MongoDB (local or Atlas).

```sh
npm ci
cp .env.example .env
# Set MONGODB_URI in .env if using Atlas or a different local database.
npm run dev
```

Open http://localhost:5173. Vite forwards `/api` to port 3001. The API exits with a clear message if MongoDB cannot be reached. If you change the API port, update [vite.config.js](./vite.config.js) too.

For a production build:

```sh
npm run build
npm start
```

Open http://localhost:3001. Express serves React and the API. The server binds to localhost by default.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/health | Database connection status |
| GET | /api/applications | List, most recently updated first |
| POST | /api/applications | Create |
| PUT | /api/applications/:id | Replace editable fields |
| DELETE | /api/applications/:id | Delete |

Example request body, also usable in Postman:

```json
{
  "company": "Example Studio",
  "role": "Junior MERN Developer",
  "status": "Applied",
  "url": "https://example.com/careers",
  "followUp": "2026-11-01",
  "notes": "Ask about the interview timeline."
}
```

Company and role are required. Status is Saved, Applied, Interview, Offer, or Rejected. Optional text fields default to empty strings. Follow-ups use the browser's local calendar date; Offer and Rejected applications are excluded from due follow-ups. There are no email reminders.

## Verification

```sh
npm test
npm run build
```

Tests exercise real CRUD against a temporary isolated MongoDB instance using mongodb-memory-server. The first run downloads a MongoDB binary and needs internet access. Tests never use your personal database.

## Structure

- [src/](./src/) — React interface and styles
- [server/](./server/) — Express routes, model, startup, and tests
- [shared/application.js](./shared/application.js) — validation, statuses, follow-up rules

## Optional project-local MongoDB

If MongoDB is installed but no database service is running, start a project-local instance in a separate terminal:

```sh
mkdir -p .local-data/mongo
mongod --dbpath .local-data/mongo --bind_ip 127.0.0.1 --port 27018
```

Set this value in your local `.env`:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27018/application_tracker
```

Then run `npm run dev` in another terminal. Keep both terminals open. The data stays in `.local-data/mongo` between restarts. A regular local MongoDB service normally uses port 27017, as shown in `.env.example`.

## Repository contents

Commit the source, `package.json`, `package-lock.json`, `.env.example`, and `.gitignore`. Your real `.env`, local database, `node_modules`, and generated build are excluded. Install dependencies with `npm ci` after downloading or cloning the repository.

This app requires Node.js and MongoDB at runtime; uploading the source to GitHub does not deploy the running app.
