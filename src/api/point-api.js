import Boom from "@hapi/boom";
import { db } from "../models/db.js";
import Joi from "joi";

export const pointApi = {
  create: {
    auth: false,
    handler: async function(request, h) {
        // TODO
    },
    tags: ["api", "Points"],
      description: "Create a new point",
      notes: "Returns the created point object",
  },
}