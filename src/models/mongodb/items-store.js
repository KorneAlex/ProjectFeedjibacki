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

  // Delete   ==================================================================================================================================

  /**
   * Soft-deletes an owned item (sets `metadata.time.deleted`).
   *
   * @returns {object|null} The item document before delete, or null if not found / not owner.
   */
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
