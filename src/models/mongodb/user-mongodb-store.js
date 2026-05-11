import { User } from "./db.js";
import { signupSchema } from "../joi-schema.js";

export const usersStore = {
  // Get      ==================================================================================================================================

  async getAllUsers() {
    return User.find().lean();
  },

  async getUserByEmail(email) {
    return User.findOne({ email }).lean();
  },

  async getUserByUsername(username) {
    return User.findOne({ username }).lean();
  },

  /**
   *
   * @param {String} id takes String if not then tries to stingify
   * @returns JSON user or null
   */
  async getUserById(id) {
    if (!id) return null;
    if (typeof id !== "string") {
      id = id.toString();
    }
    return User.findById(id);
  },
  async getUserDataById(id) {
    if (!id) return null;
    if (typeof id !== "string") {
      id = id.toString();
    }
    return User.findById(id).lean();
  },

  async getApiKeyByUserId(userId) {
    const user = await this.getUserById(userId);
    return user.map_api_key;
  },

  // Create   ==================================================================================================================================
  async addUser(userData) {
    const { error, value } = signupSchema.validate(userData);
    if (error) {
      // console.log(error);
      return null;
    };
    const userExist = await this.userExist(value.email, value.username);
    if (userExist) {
      return null;
    }
    const newUser = new User({
      username: value.username,
      email: value.email,
      password: value.password,
      points: [],
    });
    await newUser.save();
    return newUser.toObject();
  },

  async addApiKey(userId, key) {
    await User.updateOne({ _id: userId }, { map_api_key: key });
    return await this.getUserById(userId);
  },

  // Update   ==================================================================================================================================

  updateUserById: async (uid, user) => {
    if (!uid || !user) return null;
    if (typeof uid !== "string") {
      uid = uid.toString();
    }
    let updateData;
    try {
      updateData = typeof user === "string" ? JSON.parse(user) : user; // AI help
    } catch (err){
      console.log(err);
      return null;
    }
    delete updateData._id;
    delete updateData.passwordRepeat;
    delete updateData.passwordRepeat;
    const res = await User.updateOne({ _id: uid }, { $set: updateData });
    if (res.matchedCount === 0) {
      return null;
    }
    return User.findById(uid).lean();
  },

  // Delete   ==================================================================================================================================

  async deleteUserById(uid) {
    if (!uid) return null;
    if (typeof uid !== "string") {
      uid = uid.toString();
    }
    // console.log("[ deleteUserById ] deleting user: ", id)
    const result = await User.findOneAndDelete({ _id: uid });
    return result != null;
  },

  // Checkers ==================================================================================================================================

  async userExist(email, username) {
    const byEmail = await this.getUserByEmail(email);
    if (byEmail) return byEmail;
    return this.getUserByUsername(username);
  },

  async credentialsCheck(email, username, pass) {
    const user = await this.userExist(email, username);
    if (user && user.password === pass) {
      return user;
    }
    return null;
  },

  async userIsAdmin(uid) {
    try {
      const isAdmin = await User.findOne(
        { _id: uid },
        { isAdmin: 1, _id: 0 },
      ).lean();
      // console.log("[ userIsAdmin ] ", isAdmin);
      return isAdmin["isAdmin"];
    } catch {
      return null;
    }
  },

  async isLastAdmin() {
    const adminList = await User.find({ isAdmin: true }).lean();
    // console.log("adminList.length", adminList.length);
    return !!adminList.lenght == 1;
  },
};
