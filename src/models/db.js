import { connect } from "./mongodb/db.js";
import { usersStore } from "./mongodb/user-mongodb-store.js";
import { pointsStore } from "./mongodb/points-mongodb-store.js"
import { itemsStore } from "./mongodb/items-store.js";
import { collectionsStore } from "./mongodb/collections-store.js";

/** Application database facade; call `init()` once at startup before using stores. */
export const db = {
  usersStore: null,
  itemsStore: null,
  pointsStore: null,
  collectionsStore: null,

  /** Connects to MongoDB (retries until success) and wires store singletons. */
  async init() {
    let res = false;
    while (!res) {
      res = await connect();
    }
    this.usersStore = usersStore;
    this.pointsStore = pointsStore;
    this.itemsStore = itemsStore;
    this.collectionsStore = collectionsStore;
  },
};
