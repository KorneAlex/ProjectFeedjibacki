import fs from "fs/promises";
import { db } from "../models/db.js";
import {
  addPointFormSchema,
  createItemFormSchema,
  createCollectionFormSchema,
  editCollectionFormSchema,
  adminUserEditFormSchema,
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

const imageUploadPayload = {
  maxBytes: 5 * 1024 * 1024,
  parse: true,
  output: "file",
  multipart: true,
};

async function uploadImage(file, folder, id, label) {
  const uploaded = await cloudinary.uploader.upload(file.path, {
    folder,
    public_id: id,
    overwrite: true,
    resource_type: "image",
    display_name: `${label}-${id}`,
  });
  await fs.unlink(file.path).catch(() => {});
  return uploaded?.secure_url ?? null;
}

async function collectionNamesForIds(userId, collectionIds) {
  const names = [];
  for (const collectionId of collectionIds) {
    const collection = await db.collectionsStore.getCollectionDataById(collectionId);
    if (collection?.metadata?.owner === userId) {
      names.push(collection.data.name);
    }
  }
  return names;
}

function collectionIdsForItem(collections, itemId, names) {
  return collections
    .filter(
      (collection) =>
        collection.items?.some((entry) => entry._id === itemId) ||
        names.includes(collection.name),
    )
    .map((collection) => collection._id);
}

async function buildItemDataFromPayload(payload, userId, existing) {
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
  } = payload;

  const ratingDoc = { others: existing?.data?.rating?.others ?? [] };
  const ownerRating = parseRatingOwner(rating);
  if (ownerRating !== undefined) {
    ratingDoc.owner = ownerRating;
  } else if (existing?.data?.rating?.owner !== undefined) {
    ratingDoc.owner = existing.data.rating.owner;
  }

  const collectionIds = normalizeIdList(collection_ids);
  const collectionNames = await collectionNamesForIds(userId, collectionIds);

  return {
    collectionIds,
    access: normalizeItemAccess(access),
    data: {
      name,
      description: description ?? "",
      collections: collectionNames.length
        ? collectionNames
        : splitCommaList(collections),
      categories: splitCommaList(categories),
      price: {
        currency: currency?.trim()
          ? currency.trim().slice(0, 3)
          : (existing?.data?.price?.currency ?? ""),
        normal_price: normalizePriceSlot(normal_price_value),
        sale_price: normalizePriceSlot(sale_price_value),
        paid: normalizePriceSlot(paid_value),
      },
      rating: ratingDoc,
      comments: {
        owner: (comments_owner ?? "").trim(),
        others: existing?.data?.comments?.others ?? [],
      },
      shop: (shop ?? "").trim(),
      img: {
        cover: existing ? (img_cover ?? "").trim() : "",
        pictures: existing?.data?.img?.pictures ?? [],
      },
    },
  };
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

  // AI help 
  createItem: {
    auth: "jwt",
    payload: imageUploadPayload,
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
          showCreateItemForm: true,
        };
        return h
          .view("./pages/my-items", { title: "My Items", viewData })
          .takeover();
      },
    },
    handler: async (request, h) => {
      const userId = request.auth.credentials._id.toString();
      const built = await buildItemDataFromPayload(request.payload, userId);

      const savedItem = await db.itemsStore.addItem({
        metadata: {
          owner: userId,
          time: {
            created: new Date().toISOString(),
            edited: "",
            deleted: "",
          },
          access: built.access,
        },
        data: {
          ...built.data,
          img: { cover: "", pictures: [] },
        },
      });

      const itemId = savedItem._id.toString();
      if (built.collectionIds.length) {
        await db.collectionsStore.addItemToCollections(
          itemId,
          built.collectionIds,
          userId,
        );
      }

      const file = request.payload?.imagefile;
      if (file?.path) {
        try {
          const url = await uploadImage(file, "feedjibacki/items", itemId, "item");
          if (url) {
            await db.itemsStore.updateItemCoverUrl(itemId, userId, url);
          }
        } catch (err) {
          console.error(err);
          await fs.unlink(file.path).catch(() => {});
        }
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
          showCreateCollectionForm: true,
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

  editItem: {
    auth: "jwt",
    validate: {
      payload: createItemFormSchema,
      failAction: async (request, h, err) => {
        const userId = request.auth.credentials._id.toString();
        const itemId = request.params.id;
        const item = await db.itemsStore.getItemForUser(itemId, userId);
        if (!item) {
          return h.redirect("/my-items");
        }
        const collections =
          await db.collectionsStore.getAllCollectionsForUserId(userId);
        const itemCollectionNames = item.data?.collections ?? [];
        const selectedCollectionIds = collectionIdsForItem(
          collections,
          itemId,
          itemCollectionNames,
        );
        const viewData = {
          isAuthenticated: request.auth.isAuthenticated,
          userId,
          userIsAdmin: await db.usersStore.userIsAdmin(userId),
          title: item.data.name,
          subtitle: `Item · id: ${itemId}`,
          item,
          itemCategoriesCsv: (item.data?.categories ?? []).join(", "),
          collections,
          selectedCollectionIds,
          isOwner: true,
          editMode: true,
          infoMessage: err.details[0].message,
          infoClass: "has-text-danger",
        };
        return h
          .view("./pages/item", { title: item.data.name, viewData })
          .takeover();
      },
    },
    handler: async (request, h) => {
      const itemId = request.params.id;
      const userId = request.auth.credentials._id.toString();
      const existing = await db.itemsStore.getItemForUser(itemId, userId);
      if (!existing) {
        return h.redirect("/my-items");
      }

      const built = await buildItemDataFromPayload(
        request.payload,
        userId,
        existing,
      );
      const updated = await db.itemsStore.updateItemById(itemId, userId, {
        metadata: { access: built.access },
        data: built.data,
      });

      if (!updated) {
        return h.redirect("/my-items");
      }

      await db.collectionsStore.removeItemFromAllCollections(itemId, userId);
      if (built.collectionIds.length) {
        await db.collectionsStore.addItemToCollections(
          itemId,
          built.collectionIds,
          userId,
        );
      }

      return h.redirect(`/items/${itemId}?info=updated`);
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

  editUser: {
    auth: "jwt",
    handler: async (request, h) => {
      const isAdmin = await db.usersStore.userIsAdmin(
        request.auth.credentials._id,
      );
      if (!isAdmin) {
        return h.redirect("/");
      }
      const uid = request.params.uid;
      const { error, value } = adminUserEditFormSchema.validate(request.payload);
      if (error) {
        return h.redirect(`/user?userid=${uid}&edit=1&error=validation`);
      }
      await db.usersStore.updateUserById(uid, {
        username: value.username,
        email: value.email,
        isAdmin: value.isAdmin === "true",
      });
      return h.redirect(`/user?userid=${uid}&info=updated`);
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
    auth: "jwt",
    payload: imageUploadPayload,
    handler: async (request, h) => {
      const pointId = request.query.id;
      const redirectBase = pointId ? `/point?id=${pointId}` : "/my-points";
      const file = request.payload?.imagefile; // AI help with getting file from payload
      if (!file?.path) {
        return h.redirect(redirectBase);
      }

      try {
        // https://cloudinary.com/documentation/upload_images
        const url = await uploadImage(file, "feedjibacki/points", pointId, "point");
        if (url) {
          await db.pointsStore.updatePointImageUrl(pointId, url);
        }
      } catch (err) {
        console.error(err);
        await fs.unlink(file.path).catch(() => {});
      }
      return h.redirect(redirectBase);
    },
  },

  uploadItemImage: {
    auth: "jwt",
    payload: imageUploadPayload,
    handler: async (request, h) => {
      const itemId = request.query.id;
      const userId = request.auth.credentials._id.toString();
      const redirectBase = itemId
        ? `/items/${itemId}?edit=1&info=image_uploaded`
        : "/my-items";
      const file = request.payload?.imagefile;
      if (!file?.path) {
        return h.redirect(redirectBase);
      }

      const existing = await db.itemsStore.getItemForUser(itemId, userId);
      if (!existing) {
        await fs.unlink(file.path).catch(() => {});
        return h.redirect("/my-items");
      }

      try {
        const url = await uploadImage(file, "feedjibacki/items", itemId, "item");
        if (url) {
          await db.itemsStore.updateItemCoverUrl(itemId, userId, url);
        }
      } catch (err) {
        console.error(err);
        await fs.unlink(file.path).catch(() => {});
      }
      return h.redirect(redirectBase);
    },
  },
};
