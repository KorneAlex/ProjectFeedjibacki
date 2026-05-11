import fs from "fs/promises";
import { db } from "../models/db.js";
import { addPointFormSchema } from "../models/joi-schema.js";
import { cloudinary } from "../lib/cloudinary.js";

export const actionsController = {
  addApiKey: {
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
      const { lat, lon, name, description } = request.payload;
      const pointData = {
        owner: request.auth.credentials._id.toString(),
        pos: {
          lat,
          lon,
        },
        data: {
          name,
          description,
          // categories: categories, // used to filter points on map by category
        },
      };

      // console.log(pointData);

      await db.pointsStore.addPoint(pointData);
      // TODO: make it update the map without reloading the page
      // return null
      return h.redirect("/dashboard");
    },
  },

  deleteUser: {
    handler: async (request, h) => {
      const isAdmin = await db.usersStore.userIsAdmin(
        request.auth.credentials._id,
      );
      // console.log("am i admin? ", isAdmin);
      if (isAdmin) {
        const userIsAdmin = await db.usersStore.userIsAdmin(
          request.params.uid,
        );
        // console.log("is user admin? ", userIsAdmin);
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
          folder: "notemap/points",
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
