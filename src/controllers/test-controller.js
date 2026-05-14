import { testSchema } from "../models/joi-schema.js";
import { db } from "../models/db.js"

export const testController = {
  test: {
    auth: { mode: "try" },
    handler: async (request, h) => {
      const points = await db.pointsStore.getAllPointsForUserId(request.auth.credentials._id);
      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
      };
      return h.view("./pages/test", { title: "Test", viewData });
    },
  },

  testSubmit: {
    auth: false,
    validate: {
      payload: testSchema,
      failAction: (request, h, err) => {
        const viewData = {
          isAuthenticated: request.auth.isAuthenticated,
          infoMessage: err.details[0].message,
          infoClass: "has-text-danger",
        };

        return h.view("./pages/test", { title: "Test", viewData }).takeover();
      },
    },

    handler: (request, h) => {
      // console.log("Validated payload:", request.payload);

      const viewData = {
        isAuthenticated: request.auth.isAuthenticated,
        infoMessage: "Success!",
        infoClass: "has-text-success",
      };

      return h.view("./pages/test", {
        title: "Result",
        viewData,
      });
    },
  },
};
