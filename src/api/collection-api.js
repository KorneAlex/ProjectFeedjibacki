import Boom from "@hapi/boom";
import { db } from "../models/db.js";
import Joi from "joi";

const collectionListItemSchema = Joi.object({
  _id: Joi.string().required(),
  name: Joi.string().required(),
}).label("CollectionListItem");

/** JWT-protected REST endpoints for collections. */
export const collectionApi = {
  /** `GET /api/collections/getCollections` — id/name pairs for the authenticated user. */
  getCollections: {
    auth: "jwt",
    handler: async function (request) {
      try {
        const userId = request.auth.credentials._id.toString();
        const collections =
          await db.collectionsStore.getAllCollectionsForUserId(userId);
        return collections.map((collection) => ({
          _id: collection._id,
          name: collection.name,
        }));
      } catch (err) {
        console.log("[ API get collections ]", err);
        return Boom.serverUnavailable("Database Error");
      }
    },
    tags: ["api", "Collections"],
    description: "Get collections for the authenticated user",
    notes: "Returns an array of collection id/name pairs",
    response: {
      schema: Joi.array().items(collectionListItemSchema).label("CollectionsArray"),
    },
  },
};
