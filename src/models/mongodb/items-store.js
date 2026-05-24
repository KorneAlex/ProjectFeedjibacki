import { Item } from "./db.js";
import mongoose from "mongoose";

/** Excludes soft-deleted items (`metadata.time.deleted` set). */
const activeItemFilter = {
  $or: [
    { "metadata.time.deleted": "" },
    { "metadata.time.deleted": { $exists: false } },
  ],
};

/**
 * MongoDB access for items. Use via `db.itemsStore` after `db.init()`.
 * See `createItemFormSchema` / `itemSchema` in `joi-schema.js` for payloads.
 */
export const itemsStore = {
  // Get      ==================================================================================================================================

  /** Returns every non-deleted item (admin/diagnostic use). */
  getAllItems: async () => {
    return await Item.find({ ...activeItemFilter }).lean();
  },

  /**
   * Lists non-deleted items owned by `userId`, newest first.
   *
   * @param {string} userId Owner id (`metadata.owner`).
   * @returns {object[]} Lean MongoDB documents.
   */
  getAllItemsForUserId: async (userId) => {
    return await Item.find({
      "metadata.owner": userId,
      ...activeItemFilter,
    })
      .sort({ "metadata.time.created": -1 })
      .lean();
  },

  /**
   * Raw item document by id (no ownership or access check).
   *
   * @param {string} id Item ObjectId string.
   * @returns {object|null} Lean document or null if invalid / not found / deleted.
   */
  getItemById: async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Item.findOne({ _id: id, ...activeItemFilter }).lean();
  },

  /**
   * Item only when `userId` is the owner.
   *
   * @param {string} itemId
   * @param {string} userId
   * @returns {object|null}
   */
  getItemForUser: async (itemId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) return null;
    return await Item.findOne({
      _id: itemId,
      "metadata.owner": userId,
      ...activeItemFilter,
    }).lean();
  },

  /**
   * Item for detail pages: owner always; others only when `metadata.access` is `public`.
   *
   * @param {string} itemId
   * @param {string} userId Authenticated viewer id.
   * @returns {object|null}
   */
  getItemForViewer: async (itemId, userId) => {
    const item = await itemsStore.getItemById(itemId);
    if (!item) return null;

    if (item.metadata?.owner === userId) return item;

    const access = item.metadata?.access ?? "private";
    if (access === "public") return item;

    return null;
  },

  // Create   ==================================================================================================================================

  /**
   * Persists a new item document built by the controller.
   *
   * @param {object} itemData Full `metadata` + `data` object.
   * @returns {Promise<import("mongoose").Document>} Saved Mongoose document.
   */
  addItem: async (itemData) => {
    const item = new Item(itemData);
    return await item.save();
  },

  // Update   ==================================================================================================================================

  /**
   * Updates an owned item's `metadata` and `data` fields.
   *
   * @param {string} itemId
   * @param {string} userId
   * @param {object} updates `{ metadata, data }` partial document.
   * @returns {object|null} Updated lean document, or null if not found / not owner.
   */
  updateItemById: async (itemId, userId, updates) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) return null;

    const existing = await itemsStore.getItemForUser(itemId, userId);
    if (!existing) return null;

    const $set = { "metadata.time.edited": new Date().toISOString() };
    if (updates.metadata?.access !== undefined) {
      $set["metadata.access"] = updates.metadata.access;
    }

    const data = updates.data ?? {};
    for (const key of [
      "name",
      "description",
      "categories",
      "collections",
      "shop",
      "comments",
      "rating",
      "price",
    ]) {
      if (data[key] !== undefined) {
        $set[`data.${key}`] = data[key];
      }
    }
    if (data.img !== undefined) {
      $set["data.img.cover"] = data.img.cover ?? "";
      if (data.img.pictures !== undefined) {
        $set["data.img.pictures"] = data.img.pictures;
      }
    }

    await Item.updateOne({ _id: itemId }, { $set });
    return await itemsStore.getItemForUser(itemId, userId);
  },

  /**
   * Sets `data.img.cover` for an owned item (e.g. after Cloudinary upload).
   *
   * @param {string} itemId
   * @param {string} userId
   * @param {string} coverUrl
   * @returns {object|null} Updated lean document, or null if not found / not owner.
   */
  updateItemCoverUrl: async (itemId, userId, coverUrl) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) return null;
    if (!(await itemsStore.getItemForUser(itemId, userId))) return null;

    await Item.updateOne(
      { _id: itemId },
      {
        $set: {
          "data.img.cover": coverUrl,
          "metadata.time.edited": new Date().toISOString(),
        },
      },
    );
    return await itemsStore.getItemForUser(itemId, userId);
  },

  // Delete   ==================================================================================================================================

  /**
   * Soft-deletes an owned item (sets `metadata.time.deleted`).
   *
   * @returns {object|null} The item document before delete, or null if not found / not owner.
   */
  /** Returns a map of user id → number of active (non-deleted) items owned by that user. */
  getItemCountByOwner: async () => {
    const rows = await Item.aggregate([
      { $match: activeItemFilter },
      { $group: { _id: "$metadata.owner", count: { $sum: 1 } } },
    ]);
    const counts = {};
    for (const row of rows) {
      if (row._id != null) {
        counts[String(row._id)] = row.count;
      }
    }
    return counts;
  },

  deleteItemById: async (itemId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(itemId)) return null;

    const existing = await itemsStore.getItemForUser(itemId, userId);
    if (!existing) return null;

    await Item.updateOne(
      { _id: itemId },
      {
        $set: {
          "metadata.time.deleted": new Date().toISOString(),
        },
      },
    );

    return existing;
  },
};
