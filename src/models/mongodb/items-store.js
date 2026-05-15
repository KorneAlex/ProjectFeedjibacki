import { Item } from "./db.js";

export const itemsStore = {
  getAllItems: async () => {
    return await Item.find().lean();
  },

  getAllItemsForUserId: async (userId) => {
    return await Item.find({ "metadata.owner": userId }).lean();
  },

  addItem: async (itemData) => {
    const item = new Item(itemData);
    return await item.save();
  },
};
