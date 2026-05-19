import mongoose from "mongoose";
import { Collection, Item } from "./db.js";
import {
  collectionSchema,
  createCollectionFormSchema,
  editCollectionFormSchema,
} from "../joi-schema.js";

/** Excludes soft-deleted collections (`metadata.time.deleted` set). */
const activeCollectionFilter = {
  $or: [
    { "metadata.time.deleted": "" },
    { "metadata.time.deleted": { $exists: false } },
  ],
};

/** Coerces a single id, an array, or undefined into a string[] (e.g. form `item_ids`). */
function normalizeIdList(ids) {
  if (!ids) return [];
  return (Array.isArray(ids) ? ids : [ids])
    .map((id) => id?.toString?.() ?? String(id))
    .filter(Boolean);
}

/**
 * Loads item summaries for ids listed on a collection.
 * Skips invalid ObjectIds and items not owned by `ownerId`.
 *
 * @returns {{ _id: string, name: string }[]}
 */
async function resolveCollectionItems(itemIds, ownerId) {
  const items = [];
  for (const itemId of normalizeIdList(itemIds)) {
    if (!mongoose.Types.ObjectId.isValid(itemId)) continue;
    const item = await Item.findOne({
      _id: itemId,
      "metadata.owner": ownerId,
    }).lean();
    if (!item) continue;
    items.push({
      _id: item._id.toString(),
      name: item.data?.name ?? "Unnamed",
    });
  }
  return items;
}

/** Shape passed to Handlebars (`collection.hbs`, `my-collections.hbs`). */
function toCollectionView(collection, items) {
  return {
    ...collection,
    _id: collection._id.toString(),
    name: collection.data?.name ?? "",
    privacy: collection.data?.privacy ?? "private",
    itemCount: items.length,
    items,
  };
}

/**
 * MongoDB access for collections. Use via `db.collectionsStore` after `db.init()`.
 * See `createCollectionFormSchema` / `editCollectionFormSchema` in `joi-schema.js` for form payloads.
 */
export const collectionsStore = {
  // Get      ==================================================================================================================================

  /**
   * Lists all non-deleted collections for a user, newest first.
   *
   * Args:
   *   userId: Owner id string (same as `metadata.owner`).
   *
   * Returns:
   *   View objects: `{ _id, name, privacy, itemCount, items: [{ _id, name }] }`.
   *
   * Example:
   *   const list = await db.collectionsStore.getAllCollectionsForUserId(userId);
   */
  getAllCollectionsForUserId: async (userId) => {
    const collections = await Collection.find({
      "metadata.owner": userId,
      ...activeCollectionFilter,
    })
      .sort({ "metadata.time.created": -1 })
      .lean();

    const result = [];
    for (const collection of collections) {
      const items = await resolveCollectionItems(
        collection.data?.items,
        userId,
      );
      result.push(toCollectionView(collection, items));
    }
    return result;
  },

  /**
   * Raw MongoDB document by id (no ownership check).
   *
   * @param {string} id Collection ObjectId string.
   * @returns {object|null} Lean document or null if invalid / not found / deleted.
   */
  getCollectionDataById: async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Collection.findOne({ _id: id, ...activeCollectionFilter }).lean();
  },

  /**
   * Collection for a page/API when the user must own it.
   *
   * Args:
   *   collectionId, userId: Both strings.
   *
   * Returns:
   *   Same view shape as `getAllCollectionsForUserId` entries, or null.
   */
  getCollectionForUser: async (collectionId, userId) => {
    const collection = await collectionsStore.getCollectionDataById(collectionId);
    if (!collection || collection.metadata?.owner !== userId) {
      return null;
    }
    const items = await resolveCollectionItems(collection.data?.items, userId);
    return toCollectionView(collection, items);
  },

  // Create   ==================================================================================================================================

  /**
   * Creates a collection from form/API fields (validated with `createCollectionFormSchema`).
   *
   * Args:
   *   collectionData: `{ owner, name, privacy?, item_ids? }` — `item_ids` string or string[].
   *     Only items owned by `owner` are stored.
   *
   * Returns:
   *   Saved Mongoose document, or null if validation fails.
   *
   * Example:
   *   await db.collectionsStore.addCollection({
   *     owner: userId, name: "Summer", privacy: "private", item_ids: ["..."]
   *   });
   */
  addCollection: async (collectionData) => {
    const { error, value } = createCollectionFormSchema.validate(collectionData);
    if (error) return null;

    const now = new Date().toISOString();
    const owner = value.owner;
    const itemIds = normalizeIdList(value.item_ids);
    const validItemIds = [];

    for (const itemId of itemIds) {
      if (!mongoose.Types.ObjectId.isValid(itemId)) continue;
      const item = await Item.findOne({
        _id: itemId,
        "metadata.owner": owner,
      }).lean();
      if (item) validItemIds.push(itemId);
    }

    const doc = {
      metadata: {
        owner,
        time: { created: now, edited: "", deleted: "" },
      },
      data: {
        name: value.name,
        privacy: value.privacy === "shared" ? "shared" : "private",
        items: validItemIds,
      },
    };

    const { error: docError } = collectionSchema.validate(doc);
    if (docError) return null;

    const collection = new Collection(doc);
    return await collection.save();
  },

  // Update   ==================================================================================================================================

  /**
   * Replaces name, privacy, and item membership for an owned collection.
   *
   * Args:
   *   collectionId, userId: Strings.
   *   updates: `{ name, privacy?, item_ids? }` — validated with `editCollectionFormSchema`.
   *
   * Returns:
   *   Updated view object from `getCollectionForUser`, or null.
   */
  editCollection: async (collectionId, userId, updates) => {
    if (!mongoose.Types.ObjectId.isValid(collectionId)) return null;

    const existing = await collectionsStore.getCollectionForUser(
      collectionId,
      userId,
    );
    if (!existing) return null;

    const { error, value } = editCollectionFormSchema.validate(updates);
    if (error) return null;

    const itemIds = normalizeIdList(value.item_ids);
    const validItemIds = [];
    for (const itemId of itemIds) {
      if (!mongoose.Types.ObjectId.isValid(itemId)) continue;
      const item = await Item.findOne({
        _id: itemId,
        "metadata.owner": userId,
      }).lean();
      if (item) validItemIds.push(itemId);
    }

    await Collection.updateOne(
      { _id: collectionId },
      {
        $set: {
          "data.name": value.name,
          "data.privacy": value.privacy === "shared" ? "shared" : "private",
          "data.items": validItemIds,
          "metadata.time.edited": new Date().toISOString(),
        },
      },
    );

    return await collectionsStore.getCollectionForUser(collectionId, userId);
  },

  // Delete   ==================================================================================================================================

  /**
   * Soft-deletes a collection (sets `metadata.time.deleted`).
   *
   * @returns {object|null} The collection view before delete, or null if not found / not owner.
   */
  deleteCollectionById: async (collectionId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(collectionId)) return null;

    const existing = await collectionsStore.getCollectionForUser(
      collectionId,
      userId,
    );
    if (!existing) return null;

    await Collection.updateOne(
      { _id: collectionId },
      {
        $set: {
          "metadata.time.deleted": new Date().toISOString(),
        },
      },
    );

    return existing;
  },

  /**
   * Appends `itemId` to each owned collection in `collectionIds` (`$addToSet`).
   * No-op for invalid ids; skips collections not owned by `userId`.
   */
  addItemToCollections: async (itemId, collectionIds, userId) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) return;

    const ids = normalizeIdList(collectionIds);
    for (const collectionId of ids) {
      if (!mongoose.Types.ObjectId.isValid(collectionId)) continue;
      await Collection.updateOne(
        {
          _id: collectionId,
          "metadata.owner": userId,
          ...activeCollectionFilter,
        },
        {
          $addToSet: { "data.items": itemId.toString() },
          $set: { "metadata.time.edited": new Date().toISOString() },
        },
      );
    }
  },

  /**
   * Removes `itemId` from every non-deleted collection owned by `userId`.
   * Called when an item is soft-deleted.
   */
  removeItemFromAllCollections: async (itemId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) return;

    await Collection.updateMany(
      {
        "metadata.owner": userId,
        "data.items": itemId.toString(),
        ...activeCollectionFilter,
      },
      {
        $pull: { "data.items": itemId.toString() },
        $set: { "metadata.time.edited": new Date().toISOString() },
      },
    );
  },
};
