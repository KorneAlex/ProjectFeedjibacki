import dns from "node:dns";
import mongoose from "mongoose";

/** Uses `MONGO_DNS_SERVERS` or public DNS when the URL is `mongodb+srv://`. */
function configureMongoDns() {
  const configured = process.env.MONGO_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (configured?.length) {
    dns.setServers(configured);
    return;
  }

  if (process.env.MONGO_URL?.startsWith("mongodb+srv://")) {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
  }
}

/** Logs connection failures; hints at DNS fixes for SRV `EREFUSED` errors. */
function logConnectionError(err) {
  console.error("MongoDB connection failed:", err.message);
  if (err.message.includes("querySrv EREFUSED")) {
    console.error(
      "DNS SRV lookup was refused by your resolver. For mongodb+srv URLs, set public DNS in .env, e.g. MONGO_DNS_SERVERS=1.1.1.1,8.8.8.8, or use a standard mongodb:// connection string from Atlas.",
    );
  }
}

/** Attempts a single Mongoose connection using `process.env.MONGO_URL`. */
export async function connect() {
  try {
    configureMongoDns();
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected");
    return true;
  } catch (err) {
    logConnectionError(err);
    return false;
  }
}
// TODO: make the app to load if there is no connection to DB displaying the error message on the page

const userSchema = new mongoose.Schema({
  metadata: {
    time: {
      created: { type: String, default: "" },
      edited: { type: String, default: "" },
      deleted: { type: String, default: "" },
      admin_status_since: { type: String, default: "" },
    },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
  },
  data: {
    points: { type: [String], default: [] },
    items: { type: [String], default: [] },
    collections: { type: [String], default: [] },
    categories: { type: [String], default: [] },
    map_api_key: { type: String, default: "" },
  },
});

userSchema.virtual("username").get(function () {
  return this.metadata?.username;
});
userSchema.virtual("isAdmin").get(function () {
  return !!this.metadata?.isAdmin;
});
userSchema.virtual("map_api_key").get(function () {
  return this.data?.map_api_key ?? "";
});
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

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

const itemSchema = new mongoose.Schema({
  metadata: {
    owner: { type: String, required: true },
    time: {
      created: { type: String, default: "" },
      edited: { type: String, default: "" },
      deleted: { type: String, default: "" },
    },
    access: {
      type: String,
      enum: ["private", "public", "shared"],
      default: "private",
    },
  },
  data: {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    categories: { type: [String], default: [] },
    collections: { type: [String], default: [] },
    price: {
      currency: { type: String, maxlength: 3, default: "" },
      normal_price: {
        value: { type: mongoose.Schema.Types.Mixed },
      },
      sale_price: {
        value: { type: mongoose.Schema.Types.Mixed },
      },
      paid: {
        value: { type: mongoose.Schema.Types.Mixed },
      },
    },
    img: {
      cover: { type: String, default: "" },
      pictures: { type: [String], default: [] },
    },
    rating: {
      owner: { type: Number, min: 0, max: 100 },
      others: { type: [Number], default: [] },
    },
    comments: {
      owner: { type: String, maxlength: 500, default: "" },
      others: { type: [String], default: [] },
    },
    shop: { type: String, maxlength: 200, default: "" },
  },
});

const collectionSchema = new mongoose.Schema({
  metadata: {
    owner: { type: String, required: true },
    time: {
      created: { type: String, default: "" },
      edited: { type: String, default: "" },
      deleted: { type: String, default: "" },
    },
  },
  data: {
    name: { type: String, required: true },
    privacy: {
      type: String,
      enum: ["private", "shared"],
      default: "private",
    },
    items: { type: [String], default: [] },
  },
});

// TODO: Categories
// TODO: Fix pointSchema

export const User = mongoose.model("User", userSchema);
export const Point = mongoose.model("Point", pointSchema);
export const Item = mongoose.model("Item", itemSchema);
export const Collection = mongoose.model("Collection", collectionSchema);
