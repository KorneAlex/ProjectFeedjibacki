import { Point } from "./db.js";
import { User } from "./db.js";
import mongoose from "mongoose";
import { db } from "../db.js";
import { pointSchema } from "../joi-schema.js";
import { pointUpdateSchema } from "../joi-schema.js";

export const pointsStore = {
  // Get      ==================================================================================================================================

  async getAllPoints() {
    return await Point.find().lean();
  },

  /**
   * Gets points for the user by user id.
   * Returns only the points data for the matching user.
   *
   * Args:
   *   uid: The user id used to look up the user's points.
   *
   * Returns:
   *   An array of points accessable for the specified user.
   */
  async getAllPointsForUserId(uid) {
    const arr = await User.findOne(
      { _id: uid },
      { points: 1, _id: 0 }, // projection. return points without _id
    ).lean(); // get normal js object
    if (!arr) {
      return [];
    }
    const points = arr.points;
    const pointsData = [];
    for (const pointId of points) {
      const pointData = await this.getPointDataById(pointId);
      if (pointData) {
        pointsData.push(pointData);
      }
    }
    return pointsData;
  },

  async getAllPointsIdForUserId(uid) {
    const arr = await User.findOne(
      { _id: uid },
      { points: 1, _id: 0 }, // projection. returns _id only
    ).lean(); // get normal js object
    if (!arr) {
      return [];
    }
    const points = arr.points;
    const pointsIds = [];
    for (const pointId of points) {
      pointsIds.push(pointId.toString());
    }
    return pointsIds;
  },

  async getPointDataById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) { // AI fixed
      return null;
    }
    return await Point.findOne({ _id: id }).lean();
  },

  async getPointById(pid) {
    return await Point.findOne({ _id: pid });
  },

  // Create   ==================================================================================================================================

  // AI help with validation implementation
  async addPoint(pointData) {
    const { error, value } = pointSchema.validate(pointData);
    if (error) {
      // console.log(error);
      return null;
    }
    const pointToAdd = {
      ...value,
      time: {
        created: new Date(),
      },
    };
    const newPoint = new Point(pointToAdd);
    await newPoint.save();
    const user = await db.usersStore.getUserById(pointToAdd.owner);
    // console.log(user);
    user.points.push(newPoint._id.toString());
    await user.save();
    return newPoint;
  },

  // Update   ==================================================================================================================================

  /**
   *
   * it completely updates all data on the point. the idea is to pull data to fields from the existing point and change all data we want to change
   *
   * */
  async editPoint(pointId, newData) {
    // console.log("newData:\n", newData);
    const { error, value } = pointUpdateSchema.validate(newData);
    if (error) {
      // console.log(error);
      return null;
    }
    const newPointData = {
      pos: {
        lat: value.pos.lat,
        lon: value.pos.lon,
      },
      data: {
      name: value.data.name,
      description: value.data.description,
      categories: value.data.categories,
      imgUrl: value.data.imgUrl,
      },
    };
    await Point.updateOne({ _id: pointId }, { $set: newPointData });
    return await this.getPointDataById(pointId);
  },

  async updatePointImageUrl(pointId, imgUrl) {
    if (!mongoose.Types.ObjectId.isValid(pointId)) {
      return null;
    }
    await Point.updateOne(
      { _id: pointId },
      { $set: { "data.imgUrl": imgUrl } },
    );
    return await this.getPointDataById(pointId);
  },
  // Delete   ==================================================================================================================================

  async deletePointById(pid) {
    const point = await Point.findOne({ _id: pid });
    if (point) {
      return await Point.findOneAndDelete({ _id: pid });
    } else {
      return null;
    }
  },

  async deletePointsByCategory(category) {
    const points = await Point.find({ "data.categories": category });
    if (!points) {
      // console.log("No points found");
      return null;
    } else {
      for (let point of points) {
        await this.deletePointById(point._id.toString());
        // console.log("Point ", point._id.toString(), " deleted");
      }
      return points;
    }
  },

  async deletePointsByCategoryForUserId(uid, category) {
    const userPoints = await Point.find({
      owner: uid,
      "data.categories": category,
    });
    if (!userPoints) {
      // console.log("No points found");
      return null;
    } else {
      // console.log(userPoints);
      for (let point of userPoints) {
        await this.deletePointById(point._id.toString());
        // console.log("Point ", point._id.toString(), " deleted");
      }
      return userPoints;
    }
  },

  // Checkers ==================================================================================================================================
};
