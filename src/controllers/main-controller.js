import { db } from "../models/db.js";

/** Hapi GET route handlers that render Handlebars pages. */
export const mainController = {
  index: {
    auth: { mode: "try" },
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id;
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
      };
      return h.view("index", {
        title: "Feedjibacki — Home",
        message: `Welcome to Feedjibacki!`,
        viewData: viewData,
      });
    },
  },

  about: {
    auth: { mode: "try" },
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id;
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
      };
      return h.view("./pages/about", {
        title: "About Feedjibacki",
        viewData: viewData,
      });
    },
  },

  map: {
    auth: "jwt",
    handler: async (request, h) => {
    const userId = request.auth?.credentials?._id;
    const points = await db.pointsStore.getAllPointsForUserId(
      userId.toString(),
    );
    const viewData = {
      isAuthenticated: request.auth.isAuthenticated,
      userId,
      userIsAdmin: await db.usersStore.userIsAdmin(userId),
      pointsJson: JSON.stringify(points),
      mapsApiKey: await db.usersStore.getApiKeyByUserId(userId),
    };
    return h.view("./pages/map", {
      title: "Feedback map",
      isDashboard: true,
      viewData: viewData,
    });
    },
  },

  account: {
    auth: "jwt",
    handler: async (request, h) => {
    const isAdmin = await db.usersStore.userIsAdmin(
      request.auth.credentials._id,
    );
    const viewData = {
      title: "Account",
      isAuthenticated: request.auth.isAuthenticated,
      userIsAdmin: isAdmin,
      // TODO: to reduce load on mongodb make requests to local storage. if no local storage try to get it from mongodb
      mapsApiKey: await db.usersStore.getApiKeyByUserId(
        request.auth.credentials._id,
      ),
      username: request.auth.credentials.username,
    };
    // console.log(viewData.username);
    if (request.query.info === "success") {
      viewData.infoMessage = "API key saved successfully!";
      viewData.infoClass = "has-text-success";
    }
    if (request.query.error === "empty") {
      viewData.infoMessage = "Please enter an API key.";
      viewData.infoClass = "has-text-danger";
    }
    return h.view("./pages/account", { title: "Account", viewData: viewData });
    },
  },

  point: {
    auth: "jwt",
    handler: async (request, h) => {
      const isAdmin = await db.usersStore.userIsAdmin(
        request.auth.credentials._id,
      );
      const userPoints = await db.pointsStore.getAllPointsIdForUserId(request.auth.credentials._id.toString());
      const pid = request.query.id;
      const viewDataBasic = {
        isAuthenticated: request.auth.isAuthenticated,
        userIsAdmin: isAdmin,
        username: request.auth.credentials.username,
      };
      if (userPoints.includes(pid)) { // https://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-a-value-in-javascript
        // user has the point id in his list
        const point = await db.pointsStore.getPointDataById(pid);
        const viewData = {
            title: point.data.name,
            subtitle: "Product feedback · id: " + pid,
            ...viewDataBasic,
            pointData: point
          };
          return h.view("./pages/point", { title: "Feedback", viewData: viewData });
      } else {
        // user doesn't have the point id in his list
        if (isAdmin) {
          // user is admin
          const point = await db.pointsStore.getPointDataById(pid);
          if (point != null){
            // point exist
            const viewData = {
              title: point.data.name,
              subtitle: "Product feedback (admin view)",
              ...viewDataBasic,
              pointData: point
            };
            return h.view("./pages/point", { title: "Feedback", viewData: viewData });
          } else {
            // The feedback entry doesn't exist for the admin user.
            const viewData = {
            ...viewDataBasic,
            message: "This feedback entry does not exist."
            }
            return h.view("./pages/point", { title: "Feedback", viewData: viewData });
        }
      }
        // Message for the user
        const viewData = {
        ...viewDataBasic,
        message: "This feedback entry does not exist or you do not have access to it."
      };
      return h.view("./pages/point", { title: "Feedback", viewData: viewData });
      }
    },
  },

    users: {
      auth: "jwt",
      handler: async (request, h) => {
        const isAdmin = await db.usersStore.userIsAdmin(
          request.auth.credentials._id,
        );
        let allUsers = [];
        if (!isAdmin) {
          return h.redirect("/");
        }
        allUsers = await db.usersStore.getAllUsers();
        const viewData = {
          title: "Users",
          isAuthenticated: request.auth.isAuthenticated,
          userIsAdmin: isAdmin,
          username: request.auth.credentials.username,
          users: allUsers,
        };
        if (request.query.info === "deleted") {
          viewData.message = "The user has been deleted.";
        }
        if (request.query.error === "admin") {
          viewData.message =
            "The user is Admin. Remove admin status first.";
        }
        await db.usersStore.isLastAdmin();
        return h.view("./pages/users", { title: "Users", viewData: viewData });
      },
    },

  user: {
    auth: "jwt",
    handler: async (request, h) => {
      const isAdmin = await db.usersStore.userIsAdmin(request.auth.credentials._id);
      if (!isAdmin) {
        return h.redirect("/");
      }
      const viewData = {
        title: isAdmin ? "Admin " + request.auth.credentials.username: "User " + request.auth.credentials.username,
        isAuthenticated: request.auth.isAuthenticated,
        userIsAdmin: isAdmin,
        username: request.auth.credentials.username,
        userData: await db.usersStore.getUserDataById(request.query.userid),
      };
      return h.view("./pages/user", { title: "Users", viewData: viewData });
    },
  },

  myPoints: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id;
      const points = await db.pointsStore.getAllPointsForUserId(
        userId.toString(),
      );
      const viewData = {
        title: "My Points",
        subtitle: "All shops you have visited",
        isAuthenticated: request.auth.isAuthenticated,
        userId,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
        pointsJson: JSON.stringify(points),
        points: points,
      };
      return h.view("./pages/my-points", {
        title: "My Points",
        // isMyPoints: true,
        viewData: viewData,
      });
    },
  },

  /** Lists the user's collections and items (`/my-collections`). */
  myCollections: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id.toString();
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
      };
      if (request.query.info === "created") {
        viewData.infoMessage = "Collection created successfully.";
        viewData.infoClass = "has-text-success";
      }
      if (request.query.info === "deleted") {
        viewData.infoMessage = "Collection deleted.";
        viewData.infoClass = "has-text-success";
      }
      return h.view("./pages/my-collections", {
        title: "My Collections",
        viewData: viewData,
      });
    },
  },

  /** Single collection detail/edit page (`/collections/{id}`). */
  collection: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id.toString();
      const collectionId = request.params.id;
      const viewDataBasic = {
        isAuthenticated: request.auth.isAuthenticated,
        userId,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
      };

      const collection = await db.collectionsStore.getCollectionForUser(
        collectionId,
        userId,
      );

      if (!collection) {
        return h.view("./pages/collection", {
          title: "Collection",
          viewData: {
            ...viewDataBasic,
            title: "Collection",
            message:
              "This collection does not exist or you do not have access to it.",
          },
        });
      }

      const items = await db.itemsStore.getAllItemsForUserId(userId);
      const viewData = {
        ...viewDataBasic,
        title: collection.name,
        subtitle: `${collection.itemCount} item(s) · ${collection.privacy}`,
        collection,
        items,
        editMode: request.query.edit === "1",
      };

      if (request.query.info === "updated") {
        viewData.infoMessage = "Collection updated successfully.";
        viewData.infoClass = "has-text-success";
      }

      return h.view("./pages/collection", {
        title: collection.name,
        viewData: viewData,
      });
    },
  },

  myCategories: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id;
      const categories = await db.categoriesStore.getAllCategoriesForUserId(
        userId.toString(),
      );
      const viewData = {
        title: "My Categories",
        subtitle: "Add categories to group your products",
        isAuthenticated: request.auth.isAuthenticated,
        userId,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
        categoriesJson: JSON.stringify(categories),
        categories: categories,
      };
      return h.view("./pages/my-categories", {
        title: "My Categories",
        viewData: viewData,
      });
    },
    },

  /** Lists the user's items with collection pickers (`/my-items`). */
  myItems: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id.toString();
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
      };
      if (request.query.info === "deleted") {
        viewData.infoMessage = "Item deleted.";
        viewData.infoClass = "has-text-success";
      }
      return h.view("./pages/my-items", {
        title: "My Items",
        viewData: viewData,
      });
    },
  },

  /** Single item detail/edit page (`/items/{id}`); respects `metadata.access`. */
  item: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id.toString();
      const itemId = request.params.id;
      const viewDataBasic = {
        isAuthenticated: request.auth.isAuthenticated,
        userId,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
      };

      const item = await db.itemsStore.getItemForViewer(itemId, userId);

      if (!item) {
        return h.view("./pages/item", {
          title: "Item",
          viewData: {
            ...viewDataBasic,
            title: "Item",
            message:
              "This item does not exist or you do not have access to it.",
          },
        });
      }

      const isOwner = item.metadata.owner === userId;
      const collections = isOwner
        ? await db.collectionsStore.getAllCollectionsForUserId(userId)
        : [];
      const viewData = {
        ...viewDataBasic,
        title: item.data.name,
        subtitle: `Item · id: ${itemId}`,
        item,
        collections,
        isOwner,
        editMode: isOwner && request.query.edit === "1",
      };

      if (request.query.info === "updated") {
        viewData.infoMessage = "Item updated successfully.";
        viewData.infoClass = "has-text-success";
      }

      return h.view("./pages/item", {
        title: item.data.name,
        viewData,
      });
    },
  },
};
