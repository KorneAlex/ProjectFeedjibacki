import { User } from "./db.js";
import { signupSchema } from "../joi-schema.js";

//AI Help
function mapUpdateToNested(updateData) {
  const paths = {
    username: "metadata.username",
    email: "metadata.email",
    password: "metadata.password",
    isAdmin: "metadata.isAdmin",
    map_api_key: "data.map_api_key",
    points: "data.points",
  };
  const setFields = {};
  for (const [key, path] of Object.entries(paths)) {
    if (updateData[key] !== undefined) {
      setFields[path] = updateData[key];
    }
  }
  return setFields;
}

export const usersStore = {
  // Get      ==================================================================================================================================

  async getAllUsers() {
    return User.find().lean();
  },

  async getUserByEmail(email) {
    return await User.findOne({ "metadata.email": email }).lean();
  },

  async getUserByUsername(username) {
    return await User.findOne({ "metadata.username": username }).lean();
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
    return await User.findById(id).lean();
  },

  async getApiKeyByUserId(userId) {
    const user = await this.getUserById(userId);
    return user?.data?.map_api_key ?? user?.map_api_key;
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
      metadata: {
        username: value.username,
        email: value.email,
        password: value.password,
        isAdmin: false,
        time: {
          created: new Date().toISOString(),
          edited: "",
          deleted: "",
          admin_status_since: "",
        },
      },
      data: {
        points: [],
        items: [],
        collections: [],
        categories: [],
        map_api_key: "",
      },
    });
    await newUser.save();
    return newUser.toObject();
  },

  async addApiKey(userId, key) {
    await User.updateOne({ _id: userId }, { $set: { "data.map_api_key": key } });
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
    const setFields = mapUpdateToNested(updateData);
    if (Object.keys(setFields).length === 0) {
      return null;
    }
    setFields["metadata.time.edited"] = new Date().toISOString();
    const res = await User.updateOne({ _id: uid }, { $set: setFields });
    if (res.matchedCount === 0) {
      return null;
    }
    return await User.findById(uid).lean();
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
    if (user && user.metadata?.password === pass) {
      return user;
    }
    return null;
  },

  async userIsAdmin(uid) {
    try {
      const isAdmin = await User.findOne(
        { _id: uid },
        { "metadata.isAdmin": 1, _id: 0 },
      ).lean();
      // console.log("[ userIsAdmin ] ", isAdmin);
      return isAdmin?.metadata?.isAdmin;
    } catch {
      return null;
    }
  },

  async isLastAdmin() {
    const adminList = await User.find({ "metadata.isAdmin": true }).lean();
    // console.log("adminList.length", adminList.length);
    return !!adminList.lenght == 1;
  },
};
