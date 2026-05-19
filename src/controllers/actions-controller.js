import fs from "fs/promises";
import { db } from "../models/db.js";
import {
  addPointFormSchema,
  createItemFormSchema,
  createCollectionFormSchema,
  editCollectionFormSchema,
} from "../models/joi-schema.js";
import { cloudinary } from "../lib/cloudinary.js";

/** Splits a comma-separated form field into trimmed non-empty strings. */
function splitCommaList(str) {
  if (!str || typeof str !== "string") return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Coerces a single id, an array, or undefined into a string[] (e.g. `collection_ids`). */
function normalizeIdList(ids) {
  if (!ids) return [];
  return (Array.isArray(ids) ? ids : [ids])
    .map((id) => id?.toString?.() ?? String(id))
    .filter(Boolean);
}

/** Maps form `access` to `private` | `public` | `shared` (unknown → `private`). */
function normalizeItemAccess(access) {
  if (access === "public") return "public";
  if (access === "shared") return "shared";
  return "private";
}

/** Parses owner rating 0–100 from form input; returns `undefined` when empty/invalid. */
function parseRatingOwner(rating) {
  if (rating === undefined || rating === null || rating === "") {
    return undefined;
  }
  const n =
    typeof rating === "number" ? rating : Number.parseInt(String(rating), 10);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Map form/API scalar or `{ value }` to stored `{ value: number | "" }`. */
function normalizePriceSlot(partOrScalar) {
  const raw =
    partOrScalar != null &&
    typeof partOrScalar === "object" &&
    "value" in partOrScalar
      ? partOrScalar.value
      : partOrScalar;
  if (raw === undefined || raw === null || raw === "") {
    return { value: "" };
  }
  const n = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  return Number.isFinite(n) && n >= 0 ? { value: n } : { value: "" };
}

/** Hapi route handlers for POST/GET form actions (items, collections, points, account). */
export const actionsController = {
  addApiKey: {
    auth: {
      strategy: "jwt",
    },
    handler: async (request, h) => {
      const userId = request.auth.credentials._id;
      const apiKey = request.payload.MAP_API_KEY; // TODO: add trunkate(delete spaces)
      // console.log(userId, apiKey)

      if (!apiKey) {
        return h.redirect("/account?error=empty");
      }

      await db.usersStore.addApiKey(userId, apiKey);
      return h.redirect("/account?info=success");
    },
  },

  addPoint: {
    auth: {
      strategy: "jwt",
    },
    validate: {
      payload: addPointFormSchema,
      failAction: (request, h, err) => {
        const viewData = {
          isAuthenticated: request.auth.isAuthenticated,
          infoMessage: err.details[0].message,
          infoClass: "has-text-danger",
        };
        // console.log(err);
        return h
          .view("./pages/account", { title: "Account", viewData })
          .takeover();
      },
    },
    handler: async (request, h) => {
      const { lat, lon, name, description, categories } = request.payload;
      const pointData = {
        owner: request.auth.credentials._id.toString(),
        pos: {
          lat,
          lon,
        },
        data: {
          name,
          description: description || "",
          categories: categories // AI help
            ? categories
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : [],
        },
      };

      await db.pointsStore.addPoint(pointData);
      return h.redirect("/map");
    },
  },

  createItem: {
    auth: "jwt",
    validate: {
      payload: createItemFormSchema,
      failAction: async (request, h, err) => {
        const userId = request.auth.credentials._id.toString();
        const items = await db.itemsStore.getAllItemsForUserId(userId);
        const collections = await db.collectionsStore.getAllCollectionsForUserId(
          userId,
        );
        const viewData = {
          title: "My Items",
          subtitle: "Manage your items and feedback",
          isAuthenticated: request.auth.isAuthenticated,
          userId,
          userIsAdmin: await db.usersStore.userIsAdmin(userId),
          items,
          collections,
          infoMessage: err.details[0].message,
          infoClass: "has-text-danger",
        };
        return h
          .view("./pages/my-items", { title: "My Items", viewData })
          .takeover();
      },
    },
    handler: async (request, h) => {
      const {
        name,
        description,
        categories,
        collections,
        collection_ids,
        paid_value,
        normal_price_value,
        sale_price_value,
        currency,
        rating,
        comments_owner,
        shop,
        img_cover,
        access,
      } = request.payload;

      const ratingOwner = parseRatingOwner(rating);
      const ratingDoc = { others: [] };
      if (ratingOwner !== undefined) ratingDoc.owner = ratingOwner;

      const accessNorm = normalizeItemAccess(access);

      const userId = request.auth.credentials._id.toString();
      const collectionIds = normalizeIdList(collection_ids);
      const collectionNames = [];
      for (const collectionId of collectionIds) {
        const collection = await db.collectionsStore.getCollectionDataById(
          collectionId,
        );
        if (collection?.metadata?.owner === userId) {
          collectionNames.push(collection.data.name);
        }
      }

      const itemData = {
        metadata: {
          owner: userId,
          time: {
            created: new Date().toISOString(),
            edited: "",
            deleted: "",
          },
          access: accessNorm,
        },
        data: {
          name,
          description: description ?? "",
          collections: collectionNames.length
            ? collectionNames
            : splitCommaList(collections),
          categories: splitCommaList(categories),
          price: {
            currency: currency?.trim() ? currency.trim().slice(0, 3) : "",
            normal_price: normalizePriceSlot(normal_price_value),
            sale_price: normalizePriceSlot(sale_price_value),
            paid: normalizePriceSlot(paid_value),
          },
          rating: ratingDoc,
          comments: {
            owner: (comments_owner ?? "").trim(),
            others: [],
          },
          shop: (shop ?? "").trim(),
          img: {
            cover: (img_cover ?? "").trim(),
            pictures: [],
          },
        },
      };

      const savedItem = await db.itemsStore.addItem(itemData);
      if (collectionIds.length) {
        await db.collectionsStore.addItemToCollections(
          savedItem._id.toString(),
          collectionIds,
          userId,
        );
      }
      return h.redirect("/my-items");
    },
  },

  createCollection: {
    auth: "jwt",
    validate: {
      payload: createCollectionFormSchema,
      failAction: async (request, h, err) => {
        const userId = request.auth.credentials._id.toString();
        const collections = await db.collectionsStore.getAllCollectionsForUserId(
          userId,
        );
        const items = await db.itemsStore.getAllItemsForUserId(userId);
        const viewData = {
          title: "My Collections",
          subtitle: "Group your items into collections",
          isAuthenticated: request.auth.isAuthenticated,
          userId,
          userIsAdmin: await db.usersStore.userIsAdmin(userId),
          collections,
          items,
          infoMessage: err.details[0].message,
          infoClass: "has-text-danger",
        };
        return h
          .view("./pages/my-collections", { title: "My Collections", viewData })
          .takeover();
      },
    },
    handler: async (request, h) => {
      const { name, privacy, item_ids } = request.payload;
      await db.collectionsStore.addCollection({
        owner: request.auth.credentials._id.toString(),
        name,
        privacy,
        item_ids,
      });
      return h.redirect("/my-collections?info=created");
    },
  },

  editCollection: {
    auth: "jwt",
    validate: {
      payload: editCollectionFormSchema,
      failAction: async (request, h, err) => {
        const userId = request.auth.credentials._id.toString();
        const collectionId = request.params.id;
        const collection = await db.collectionsStore.getCollectionForUser(
          collectionId,
          userId,
        );
        const items = await db.itemsStore.getAllItemsForUserId(userId);
        const viewData = {
          isAuthenticated: request.auth.isAuthenticated,
          userId,
          userIsAdmin: await db.usersStore.userIsAdmin(userId),
          title: collection?.name ?? "Collection",
          collection,
          items,
          editMode: true,
          infoMessage: err.details[0].message,
          infoClass: "has-text-danger",
        };
        return h
          .view("./pages/collection", {
            title: collection?.name ?? "Collection",
            viewData,
          })
          .takeover();
      },
    },
    handler: async (request, h) => {
      const collectionId = request.params.id;
      const userId = request.auth.credentials._id.toString();
      const { name, privacy, item_ids } = request.payload;

      const updated = await db.collectionsStore.editCollection(
        collectionId,
        userId,
        { name, privacy, item_ids },
      );

      if (!updated) {
        return h.redirect("/my-collections");
      }

      return h.redirect(`/collections/${collectionId}?info=updated`);
    },
  },

  deleteCollection: {
    auth: "jwt",
    handler: async (request, h) => {
      const collectionId = request.params.id;
      const userId = request.auth.credentials._id.toString();
      await db.collectionsStore.deleteCollectionById(collectionId, userId);
      return h.redirect("/my-collections?info=deleted");
    },
  },

  deleteItem: {
    auth: "jwt",
    handler: async (request, h) => {
      const itemId = request.params.id;
      const userId = request.auth.credentials._id.toString();
      const deleted = await db.itemsStore.deleteItemById(itemId, userId);
      if (deleted) {
        await db.collectionsStore.removeItemFromAllCollections(itemId, userId);
      }
      return h.redirect("/my-items?info=deleted");
    },
  },

  deleteUser: {
    auth: {
      strategy: "jwt",
    },
    handler: async (request, h) => {
      const isAdmin = await db.usersStore.userIsAdmin(
        request.auth.credentials._id,
      );
      if (isAdmin) {
        const userIsAdmin = await db.usersStore.userIsAdmin(
          request.params.uid,
        );
        if (!userIsAdmin) {
          await db.usersStore.deleteUserById(request.params.uid);
        } else {
          return h.redirect("/users?error=admin");
        }
      }
      return h.redirect("/users?info=deleted");
    },
  },

  // Points

  // https://console.cloudinary.com/app/c-66b926e4a8b5144cfd27d31bc53a3b/image/getting-started
  uploadPointImage: {
    auth: {
      strategy: "jwt",
    },
    payload: {
      maxBytes: 5 * 1024 * 1024,
      parse: true,
      output: "file",
      multipart: true,
    },
    handler: async (request, h) => {
      const pointId = request.query.id;
      const redirectBase = pointId ? `/point?id=${pointId}` : "/my-points";

      const file = request.payload?.imagefile; // AI help with getting file from payload
      if (!file?.path) {
        return h.redirect(`${redirectBase}`);
      }

      try {
        // https://cloudinary.com/documentation/upload_images
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: "feedjibacki/points",
          public_id: pointId,
          overwrite: true,
          resource_type: "image",
          display_name: `point-${pointId}`,
        });
        await fs.unlink(file.path).catch(() => {});

        const url = uploaded?.secure_url;
        if (!url) {
          return h.redirect(`${redirectBase}`);
        }

        await db.pointsStore.updatePointImageUrl(pointId, url);
        return h.redirect(`${redirectBase}`);
      } catch (err) {
        console.error(err);
        if (file?.path) {
          await fs.unlink(file.path).catch(() => {});
        }
        return h.redirect(`${redirectBase}`);
      }
    },
  },
};
