# NoteOnMap

A web application that allows users to create **collections of locations on a map**, attach **notes** and filter them to display a specific category.

The goal of the project is to provide a simple way to save interesting places, ideas, observations, or research points directly on a map interface.

Users can create collections, add markers to specific coordinates, and attach descriptive notes to each location.

The starting version has been copied and modified fom my test project that was created to practice lab contents from our lectures from WebDev2 please see it here: https://github.com/KorneAlex/webdev2

AI has been used for the UI to deal with CSS and animations. Almost never for the functions. When ever AI used for the backend you can find a comment about it.
Any other issue is solved with [stackoverflow](https://stackoverflow.com/), [geeksfor](https://www.geeksforgeeks.org/) and tools documentation.

---

## Features

- User authentication
- Create and manage map collections
- Add points to the map
- Attach notes to locations
- Store data persistently in MongoDB
- Server-side rendering using Handlebars
- Input validation
- Automated testing
- Code linting

---

## Tech Stack

Backend
- Node.js
- Hapi.js
- MongoDB
- Mongoose

Frontend
- Handlebars templates

Authentication
- @hapi/cookie
- bcrypt

Validation
- Joi

Development Tools
- ESLint
- Mocha
- Chai
- Nodemon
- dotenv

---

## Installation

Clone the repository

```bash
git clone https://github.com/KorneAlex/NoteOnMap.git
cd note-on-map
```

Install dependencies

```bash
npm install
```

Create a `.env` file in the root directory and add required environment variables (for example database connection string).

---

## Running the Application

Start the server

```bash
npm start
```

Development mode with automatic reload using Nodemon

```bash
npm run nd
```

---

## Testing

Run unit tests

```bash
npm test
```

## Linting

Check code quality using ESLint

```bash
npm run lint
```

---

## Project Structure

```
project-root
│
├── controllers     # Routes handlers
├── lib             # Modules for the server.js
├── models          # DB and module handlers 
├── views           # Handlebars templates, particles and pages
├── test            # Mocha tests
├── server.js       # Application entry point
└── .env            # Environment variables
```

---

## Purpose of the Project

This project was built for SETU Full stack Web Development Assignment2 to explore:

- building APIs with Hapi
- authentication with cookies
- MongoDB data modelling
- server-side rendering
- automated testing
- linting and code quality practices

---

## Future Improvements

- Interactive map UI
- Creating collections
- API endpoints

---

## License

This project is open source and available under the MIT License.