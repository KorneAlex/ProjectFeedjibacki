# Feedjibacki

A web application for keeping **your own personal reviews** of products you've bought and tried yourself.

When you're back at the shop and can't remember whether you liked something, Feedjibacki lets you look up **your past rating and comments**. Add **categories**, group items into **collections**, and track prices and notes in one place.

The project started from lab exercises in WebDev2 and was extended for a full-stack assignment. An earlier map-based prototype is included in the codebase but map UI is currently disabled in the frontend templates.

AI has been used for UI work (CSS and layout). Backend logic is written manually; where AI helped on the server, you'll find a comment in the code. Other problems were solved with [Stack Overflow](https://stackoverflow.com/), [GeeksforGeeks](https://www.geeksforgeeks.org/), and official documentation.

---

## Features

- User sign-up, login, and account management
- **Items** — log products you've purchased and tested, with cover images, descriptions, and shop/price fields
- **Ratings & comments** — score items (0–100) and store your own notes on each product
- **Categories** — tag items for browsing and filtering
- **Collections** — group related items (e.g. weekly shop, favourites, freezer)
- Private, public, or shared access settings on items (shared flow planned)
- Server-side rendering with Handlebars
- MongoDB persistence via Mongoose
- Joi validation on forms and APIs
- Image uploads (Cloudinary) for item cover photos
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

- JWT (`hapi-auth-jwt2`)
- bcrypt

**Other**

- Joi — validation
- Cloudinary — image hosting
- ESLint, Mocha, Chai, Nodemon, dotenv

---

## Installation

Clone the repository:

```bash
git clone https://github.com/KorneAlex/NoteOnMap.git
cd NoteOnMap
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root with the required variables (MongoDB connection, session secrets, Cloudinary keys, etc.). See your course notes or `.env.example` if one is provided.

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
│   ├── controllers/    # Route handlers
│   ├── lib/              # Server plugins, auth, Cloudinary, etc.
│   ├── models/           # Joi schemas and MongoDB stores
│   ├── views/            # Handlebars layouts, pages, partials
│   ├── css/              # Stylesheets
│   └── api/              # JSON API routes
├── test/                 # Mocha tests
├── routes.js             # Route table
├── server.js             # Application entry point
└── .env                  # Environment variables (not committed)
```

---

## Main routes (overview)

| Area | Examples |
|------|----------|
| Home | `/` |
| Account | `/login`, `/signup`, `/account` |
| Items | `/my-items`, `/items/{id}` |
| Collections | `/my-collections`, `/collections/{id}` |
| Categories | `/my-categories` |

---

## Purpose

Built for **SETU Full Stack Web Development** (Assignment 2) to practice:

- Hapi.js routing and plugins
- Authentication and authorisation
- MongoDB data modelling
- Server-side rendering
- Form validation and file uploads
- Testing and linting

---

## License

MIT License — see [package.json](package.json).
