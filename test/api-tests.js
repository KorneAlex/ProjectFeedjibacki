import M from "mocha";
import { assert } from "chai";
import { db } from "../src/models/db.js";
import { testData as td } from "../test/data-for-tests.js";
import { noteOnMapService } from "../src/api/noteonmap-service.js";

M.suite("API Service test", () => {
  M.describe("User API tests", () => {
    M.beforeEach(async () => {
      const testUser = await db.usersStore.getUserByEmail(td[0].testUser.email);
      if (testUser !== null) {
        await db.usersStore.deleteUserById(testUser._id.toString());
      }
    });
    M.it("1. Create a user", async () => {
      const newUser = await noteOnMapService.createUser(td[0].testUser);
      assert.equal(td[0].testUser.username, newUser.username);
      assert.isDefined(newUser._id);
    });

    M.it("2. Find user", async () => {
      const newUser = await noteOnMapService.createUser(td[0].testUser);
      assert.isNotNull(newUser._id);
      const getUser = await noteOnMapService.getUserById(newUser._id.toString());
      console.log(getUser);
      assert.equal(td[0].testUser.name, getUser.name);
      assert.equal(td[0].testUser.email, getUser.email);
    });

    M.it("3. Update user", async () => {
      const newUser = await noteOnMapService.createUser(td[0].testUser);
      assert.isNotNull(newUser._id);
      const payload = td[0].testUserUpdate;
      await noteOnMapService.updateUserById(newUser._id.toString(), payload);
      const checkUser = await db.usersStore.getUserById(newUser._id.toString());
      assert.equal(checkUser.password, payload.password);
    });

    M.it("4. Delete user", async () => {
      const newUser = await noteOnMapService.createUser(td[0].testUser);
      assert.isNotNull(newUser._id);
      await noteOnMapService.deleteUserById(newUser._id.toString());
      const checkUser = await db.usersStore.getUserById(newUser._id.toString());
      assert.isNull(checkUser);
    });

    M.after(async () => {
      const user = await db.usersStore.getUserByEmail(td[0].testUser.email);
      if (user !== null) {
        await db.usersStore.deleteUserById(user._id.toString());
        await db.pointsStore.deletePointsByCategory("DevTest");
      }
    });
  });
});
