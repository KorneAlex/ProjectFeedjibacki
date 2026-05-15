import { title } from "node:process";
import { db } from "../models/db.js";

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

  myCollections: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id;
      const points = await db.pointsStore.getAllPointsForUserId(
        userId.toString(),
      );
      const viewData = {
        title: "My Collections",
        subtitle: "Feedback grouped by product category",
        isAuthenticated: request.auth.isAuthenticated,
        userId,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
        pointsJson: JSON.stringify(points),
        points: points,
      };
      return h.view("./pages/my-collections", {
        title: "My Collections",
        viewData: viewData,
      });
    },
    },

  myCategories: {
    auth: "jwt",
    handler: async (request, h) => {
      const userId = request.auth?.credentials?._id;
      const points = await db.pointsStore.getAllPointsForUserId(
        userId.toString(),
      );
      const viewData = {
        title: "My Categories",
        subtitle: "Add categories to group your products",
        isAuthenticated: request.auth.isAuthenticated,
        userId,
        userIsAdmin: await db.usersStore.userIsAdmin(userId),
        pointsJson: JSON.stringify(points),
        points: points,
      };
      return h.view("./pages/my-categories", {
        title: "My Categories",
        viewData: viewData,
      });
    },
    },
};
