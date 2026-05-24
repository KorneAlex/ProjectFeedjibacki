import M from "mocha";
import { assert } from "chai";
import { db } from "../src/models/db.js";
import { usersStore } from "../src/models/mongodb/user-mongodb-store.js";
import { pointsStore } from "../src/models/mongodb/points-mongodb-store.js";
import { testData as td } from "../test/data-for-tests.js";

export const mongodbTests = M.suite("MongoDB Tests", () => {
  M.before(async () => {
    await db.init();
  });
  // Users
  M.describe("Users Collection", () => {
    M.beforeEach(async () => {
      const testUser = await db.usersStore.getUserByEmail(td[0].testUser.email);
      if (testUser !== null) {
        await db.usersStore.deleteUserById(testUser._id.toString());
      }
    });

    M.it("1. Should create a new user", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      assert.equal(newUser.metadata.username, td[0].testUser.username);
      assert.equal(newUser.metadata.email, td[0].testUser.email);
      assert.equal(newUser.metadata.password, td[0].testUser.password);
    });

    M.it("2. Should retrieve a user by email", async () => {
      await usersStore.addUser(td[0].testUser);
      const user = await usersStore.getUserByEmail(td[0].testUser.email);
      assert.isNotNull(user, "User should be found");
      assert.equal(user.metadata.username, td[0].testUser.username);
      assert.equal(user.metadata.email, td[0].testUser.email);
    });

    M.it("3. Delete a user by id", async () => {
      await usersStore.addUser(td[0].testUser);
      let user = await db.usersStore.getUserByEmail(td[0].testUser.email);
      assert.isNotNull(user, "User should be found");
      if (user !== null) {
        await db.usersStore.deleteUserById(user._id.toString());
      }
      user = await db.usersStore.getUserByEmail(td[0].testUser.email);
      assert.isNull(user, "User should not be found");
    });

    M.it("4. Failed to create a user with unacceptible info", async () => {
      const newUser1 = await usersStore.addUser(td[0].testUserWrong1);
      const newUser2 = await usersStore.addUser(td[0].testUserWrong2);
      // console.log(newUser1);
      // console.log(newUser2);
      assert.isNull(newUser1);
      assert.isNull(newUser2);
      newUser1 != null
        ? await db.usersStore.deleteUserById(newUser1._id.toString())
        : null;
      newUser2 != null
        ? await db.usersStore.deleteUserById(newUser2._id.toString())
        : null;
    });
  });

  M.after(async () => {
    const user = await db.usersStore.getUserByEmail(td[0].testUser.email);
    if (user !== null) {
      await db.usersStore.deleteUserById(user._id.toString());
      await db.pointsStore.deletePointsByCategory("DevTest");
    }
  });

  // Points
  M.describe("Points collection", () => {
    M.beforeEach(async () => {
      const user = await db.usersStore.getUserByEmail(td[0].testUser.email);
      if (user !== null) {
        await db.usersStore.deleteUserById(user._id.toString());
      }
    });

    M.it("1. Create point with correct data", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      let uid = newUser["_id"].toString();
      const pointData = {
        ...td[0].testPointCorrect1,
        owner: uid,
      };
      const newPoint = await pointsStore.addPoint(pointData);
      // console.log("new point: ", newPoint);
      assert.isNotNull(newPoint["_id"], "Point ID should not be null");
      assert.isNotNull(
        newPoint.time.created,
        "Time created should not be null",
      );
      assert.strictEqual(newPoint.data.name, pointData.data.name);
      assert.strictEqual(newPoint.data.description, pointData.data.description);
      assert.deepEqual(newPoint.data.categories, pointData.data.categories);
      assert.strictEqual(newPoint.pos.lat, pointData.pos.lat);
      assert.strictEqual(newPoint.pos.lon, pointData.pos.lon);
      await pointsStore.deletePointsByCategoryForUserId(uid, "DevTest");
    });

    M.it("2. Get points for testUser", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      let uid = newUser["_id"].toString();
      const pointData1 = {
        ...td[0].testPointCorrect1,
        owner: uid,
      };
      const pointData2 = {
        ...td[0].testPointCorrect2,
        owner: uid,
      };
      const newPoint1 = await pointsStore.addPoint(pointData1);
      const newPoint2 = await pointsStore.addPoint(pointData2);
      const points = await db.pointsStore.getAllPointsForUserId(uid);
      assert.strictEqual(newPoint1._id.toString(), points[0]._id.toString());
      assert.strictEqual(newPoint2._id.toString(), points[1]._id.toString());
      await pointsStore.deletePointsByCategoryForUserId(uid, "DevTest");
    });

    M.it("3. Edit point", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      let uid = newUser["_id"].toString();
      const pointData1 = {
        ...td[0].testPointCorrect1,
        owner: uid,
      };
      const newPoint = await pointsStore.addPoint(pointData1);
      // console.log("[ EDIT POINT ]\n");
      // console.log("Point data:\n", newPoint);
      // console.log("New data:\n", pointData1);
      const updatedPoint = await pointsStore.editPoint(
        newPoint._id.toString(),
        td[0].testPointCorrect2,
      );
      // console.log("Updated point:\n", updatedPoint);
      assert.isNotNull(updatedPoint);
      assert.deepEqual(td[0].testPointCorrect2.data, updatedPoint.data);
    });

    M.it("4. Edit point with wrong data", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      let uid = newUser["_id"].toString();
      const pointData1 = {
        ...td[0].testPointCorrect1,
        owner: uid,
      };
      const newPoint = await pointsStore.addPoint(pointData1);
      const updatedPoint = await pointsStore.editPoint(
        newPoint._id.toString(),
        td[0].testPointWrong1,
      );
      assert.isNull(updatedPoint);
    });

    M.it("5. Delete point by id", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      let uid = newUser["_id"].toString();
      const pointData = {
        ...td[0].testPointCorrect1,
        owner: uid,
      };
      let newPoint = await pointsStore.addPoint(pointData);
      assert.isNotNull(newPoint["_id"], "Point ID should be found");
      await pointsStore.deletePointById(newPoint._id.toString());
      newPoint = await pointsStore.addPoint(pointData);
      assert.isNotNull(newPoint["_id"], "Point ID should not be found");
    });

    M.it("5. Delete point by category for user id", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      let uid = newUser["_id"].toString();
      const pointData = {
        ...td[0].testPointCorrect1,
        owner: uid,
      };
      const newPoint = await pointsStore.addPoint(pointData);
      const category = "DevTest";
      assert.isNotNull(
        await db.pointsStore.getPointById(newPoint._id.toString()),
      );
      const pointsToDelete = await pointsStore.deletePointsByCategoryForUserId(
        uid,
        category,
      );
      if (pointsToDelete == null) {
        console.log("[ TEST5 ] No points Found");
      }
      assert.isNull(await db.pointsStore.getPointById(newPoint._id.toString()));
    });

    M.it("6. Failed to create a point with unacceptible info", async () => {
      const newUser = await usersStore.addUser(td[0].testUser);
      let uid = newUser["_id"].toString();
      const pointData = {
        ...td[0].testPointWrong1,
        owner: uid,
      };
      const newPoint = await pointsStore.addPoint(pointData);
      assert.isNull(newPoint);
      await pointsStore.deletePointsByCategoryForUserId(uid, "DevTest");
    });

    M.after(async () => {
      const user = await db.usersStore.getUserByEmail(td[0].testUser.email);

      if (user !== null) {
        await db.usersStore.deleteUserById(user._id.toString());
      }
      await db.pointsStore.deletePointsByCategory("DevTest");
    });
  });
});
