# Feedjibacki

A web application for keeping **your own personal reviews** of products you've bought and tried yourself.

When you're back at the shop and can't remember whether you liked something, Feedjibacki lets you look up **your past rating and comments**. Add **categories**, group items into **collections**, and track prices and notes in one place.

The project started from lab exercises in WebDev2 and was extended for a full-stack assignment. An earlier map-based prototype is included in the codebase but map UI is currently disabled in the frontend templates.

AI has been used for UI work (CSS and layout). Backend logic is written manually; where AI helped on the server, you'll find a comment in the code. Other problems were solved with [Stack Overflow](https://stackoverflow.com/), [GeeksforGeeks](https://www.geeksforgeeks.org/), and official documentation.

---

## Features

- User sign-up, login, and account management (JWT cookies with refresh)
- **Items** — log products you've purchased and tested, with cover images, descriptions, and shop/price fields
- **Ratings & comments** — score items (0–100) and store your own notes on each product
- **Categories** — tag items for browsing and filtering
- **Collections** — group related items (e.g. weekly shop, favourites, freezer)
- **Item access** — `private`, `public` (any signed-in user), or `shared` (named guest links)
- **Guest share links** — owners create labelled links (`/shared/{itemId}?token=...`); guests get read-only access without an account; links can be revoked individually
- Server-side rendering with Handlebars
- MongoDB persistence via Mongoose
- Joi validation on forms and APIs
- Image uploads (Cloudinary) for item cover photos
- Responsive layout (including mobile-friendly shared-links list on item pages)
- Automated tests and ESLint

---

## Tech Stack

**Backend**

- Node.js
- Hapi.js
- MongoDB
- Mongoose

**Frontend**

- Handlebars templates
- Bulma CSS

**Authentication**

- JWT (`hapi-auth-jwt2`) — access and refresh tokens in httpOnly cookies
- bcrypt — password hashing
- Signed share tokens for guest item access (`user_id`, `item_id`, `access: guest`)

**Other**

- Joi — validation
- Cloudinary — image hosting
- ESLint, Mocha, Chai, Nodemon, dotenv

---

## Installation

Clone the repository and enter the project directory:

```bash
git clone <your-repo-url>
cd ProjectFeedjibacki
```

Install dependencies:

```bash
npm install
```

Copy environment variables from the template and fill in your values:

```bash
cp .env.template .env
```

Required settings include `MONGO_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, Cloudinary credentials, and `SERVICE_URL` (used when building full share-link URLs for owners to copy).

---

## Running the Application

Start the server:

```bash
npm start
```

Development mode with automatic reload (Nodemon):

```bash
npm run nd
```

Open the app in your browser at the URL shown in the console (typically `http://localhost:3000`).

---

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

---

## Project Structure

```
project-root
├── src/
│   ├── controllers/    # Route handlers (pages and actions)
│   ├── lib/            # Server plugins, auth, views, Cloudinary, etc.
│   ├── models/         # Joi schemas and MongoDB stores
│   ├── views/          # Handlebars layouts, pages, partials
│   ├── css/            # Stylesheets
│   └── api/            # JSON API routes
├── test/               # Mocha tests
├── routes.js           # HTML page and form routes
├── api-routes.js       # REST API routes
├── server.js           # Application entry point
├── .env.template       # Environment variable template
└── .env                # Local secrets (not committed)
```

---

## Main routes (overview)

| Area | Examples |
|------|----------|
| Home | `/` |
| Account | `/login`, `/signup`, `/account`, `/auth/refresh`, `/logout` |
| Items | `/my-items`, `/items/{id}`, `POST /items/{id}/share`, `GET /items/{id}/share/{name}/delete` |
| Shared (guest) | `/shared/{id}?token=...`, `/shared/invalid` |
| Collections | `/my-collections`, `/collections/{id}` |
| Categories | `/my-categories` |

---

## Item sharing (summary)

1. Set an item’s access to **Shared** (or create a share link, which sets access automatically).
2. On the item page, click **Share**, enter a name for the link, and submit.
3. Copy the generated URL and send it to someone; they can open the read-only shared item page without logging in.
4. Manage active links on the item page (open, copy, or delete). Deleting a link invalidates that token immediately.

---

## Purpose

Built for **SETU Full Stack Web Development** (Assignment 2) to practice:

- Hapi.js routing and plugins
- Authentication and authorisation
- MongoDB data modelling
- Server-side rendering
- Form validation and file uploads
- Guest access via signed tokens
- Testing and linting

---

## License

MIT License — see [package.json](package.json).
