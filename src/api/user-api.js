import Boom from "@hapi/boom";
import { db } from "../models/db.js";
import { signupSchema, userResponseSchema, userUpdateSchema } from "../models/joi-schema.js";
import Joi from "joi";

export const userApi = {
  create: {
    auth: false,
    handler: async function(request, h) {
      try {
        const user = await db.usersStore.addUser(request.payload);
        if (user) {
          return h.response(user).code(201);
        }
        const { error } = signupSchema.validate(request.payload);
        if (error) {
          return Boom.badRequest(error.details[0].message);
        }
        return Boom.conflict(
          "An account with this email or username already exists",
        );
      } catch (err) {
        return Boom.serverUnavailable("Database Error");
      }
    },
    tags: ["api", "Users"],
      description: "Create a new user",
      notes: "Returns the created user object",
      response: {
      schema: userResponseSchema.label("CreatedUser"),
    },
    validate: { payload: signupSchema.label("Signup") },
  },

  getAll: {
    auth: 'jwt',
    handler: async function(request, h) {
      try {
        return await db.usersStore.getAllUsers();
      } catch (err) {
        console.log("[ API getAll ]");
        return Boom.serverUnavailable("Database Error");
      }
    },
    tags: ["api", "Users"],
    description: "Get all users",
    notes: "Returns an array of user objects",
    response: {
      schema: Joi.array().items(userResponseSchema).label("UsersArray"),
    }
  },

  getOne: {
    auth: false,
    handler: async function(request, h) {
      try {
        console.log("[ API getOne ]", request.query.id)
        return await db.usersStore.getUserDataById(request.query.id);
      } catch (err) {
        console.log("[ API getOne ]");
        return Boom.serverUnavailable("Database Error");
      }
    },
    tags: ["api", "Users"],
    description: "Get a user by ID",
    notes: "Returns a user object",
    response: {
      schema: userResponseSchema.label("UserById"),
    },
    validate: { query: Joi.object({ id: Joi.string().required() }) },
  },

  delete: {
    auth: false,
    handler: async function(request, h) {
      try {
        const deleted = await db.usersStore.deleteUserById(request.query.id);
        if (deleted === true) {
          return true;
        }
        return Boom.notFound("No user with this id");
      } catch (err) {
        console.log("[ API delete ]", err);
        return Boom.serverUnavailable("Database Error");
      }
    },
    tags: ["api", "Users"],
    description: "Delete a user",
    notes: "Returns true when the user was deleted, or 404 if no user matched the id",
    response: {
      schema: Joi.boolean().valid(true).required(),
    },
    validate: { query: Joi.object({ id: Joi.string().required() }) },
  },

  update: {
    auth: false,
    handler: async function(request, h) {
      try {
        const updated = await db.usersStore.updateUserById(
          request.query.id,
          request.payload,
        );
        if (updated) {
          return h.response(updated).code(200);
        }
        return Boom.notFound("No user with this id");
      } catch (err) {
        console.log("[ API UPDATE user-api ] ", err);
        return Boom.serverUnavailable("Database Error");
      }
    },
    tags: ["api", "Users"],
    description: "Update a user",
    notes: "Returns the updated user object",
    response: {
      schema: userResponseSchema.label("UpdatedUser"),
    },
    validate: { query: Joi.object({ id: Joi.string().required() }), payload: userUpdateSchema },
  },
};