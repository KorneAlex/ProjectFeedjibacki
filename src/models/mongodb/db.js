import mongoose from "mongoose";

export async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
    return true;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    return false;
  }
}
  // TODO: make the app to load if there is no connection to DB displaying the error message on the page


const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  map_api_key: { type: String, required: false },
  points: { type: Array, required: false },
  isAdmin: { type: Boolean, default: false },
});

const pointSchema = new mongoose.Schema({
  owner: { type: String, required: true },
  time: {
    created: { type: String, required: true },
  },
  pos: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  data: {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    categories: { type: [String], default: [] }, // array of strings (AI help)
    imgUrl: { type: String, required: false },
  },
});

// TODO: Categories
// TODO: Fix pointSchema

export const User = mongoose.model("User", userSchema);
export const Point = mongoose.model("Point", pointSchema);
