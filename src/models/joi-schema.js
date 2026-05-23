import Joi from "joi";

export const testSchema = Joi.object({
  testInput: Joi.string().min(3).max(5).required(),
  testNumber: Joi.number().integer().min(1).max(100).required(),
  testEmail: Joi.string().email().required(),
});

// TODO: add proper checks for password (password strength)
export const signupSchema = Joi.object({
  username: Joi.string().alphanum().min(2).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(30).required(),
  passwordRepeat: Joi.string().min(6).max(30).required(),
})
// AI help: custom validation to check if password and passwordRepeat match for the swagger api
  .custom((value, helpers) => {
    if (value.password !== value.passwordRepeat) {
      return helpers.error("object.passwordMismatch");
    }
    return value;
  })
  .messages({
    "object.passwordMismatch": "Passwords do not match",
  });


export const userSchema = Joi.object({
  username: Joi.string().alphanum().min(2).max(20).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(30).required(),
});

export const userUpdateSchema = Joi.object({
  username: Joi.string().alphanum().min(2).max(20),
  email: Joi.string().email(),
  password: Joi.string().min(6).max(30),
  passwordRepeat: Joi.string().min(6).max(30),
})
  .custom((value, helpers) => {
    const hasUsername = value.username !== undefined;
    const hasEmail = value.email !== undefined;
    const hasPassword = value.password !== undefined;
    const hasRepeat = value.passwordRepeat !== undefined;

    if (hasPassword !== hasRepeat) {
      return helpers.error("object.passwordPair");
    }
    if (hasPassword && value.password !== value.passwordRepeat) {
      return helpers.error("object.passwordMismatch");
    }
    if (!hasUsername && !hasEmail && !hasPassword) {
      return helpers.error("object.needUpdateField");
    }
    return value;
  })
  .messages({
    "object.passwordPair":
      "password and passwordRepeat must both be provided to change the password",
    "object.passwordMismatch": "Passwords do not match",
    "object.needUpdateField":
      "Provide username, or email, or both password and passwordRepeat",
  })
  .label("UserUpdate");

/** POST `/user/{uid}/edit` — admin edits username, email, and admin flag (no password). */
export const adminUserEditFormSchema = Joi.object({
  username: Joi.string().alphanum().min(2).max(20).required(),
  email: Joi.string().email().required(),
  isAdmin: Joi.string().valid("true").optional(),
});

/** MongoDB user document shape for API responses (allows _id, points, __v, isAdmin, etc.). Added by AI */
export const userResponseSchema = userSchema.unknown(true).label("User");

export const pointSchema = Joi.object({
  owner: Joi.string(),
  pos: {
    lat: Joi.number().min(-90).max(90).required(), // -90 to 90
    lon: Joi.number().min(-180).max(180).required(), // -180 to 180
  },
  data: {
    name: Joi.string().min(2).max(20).required(),
    description: Joi.string().max(200),
    imgUrl: Joi.string().uri().optional(),
    categories: Joi.array().items(Joi.string().alphanum().min(1).max(20)), // AI help
  },
});

// Schema for the add-point form
export const addPointFormSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lon: Joi.number().min(-180).max(180).required(),
  name: Joi.string().min(2).max(20).required(),
  description: Joi.string().max(200),
  imgUrl: Joi.string().uri().optional(),
  categories: Joi.string().allow("").optional(), // AI help
});

const optionalPriceScalar = Joi.alternatives()
  .try(Joi.number().min(0), Joi.string().allow(""))
  .optional();

/**
 * Web form POST `/items/create-item`.
 * Uses flat names (e.g. paid_value) because Hapi leaves bracket keys like paid[value]
 * as literal properties, which Joi rejects.
 */
export const createItemFormSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).allow("").optional(),
  categories: Joi.string().allow("").optional(),
  collections: Joi.string().allow("").optional(),
  collection_ids: Joi.alternatives()
    .try(Joi.string(), Joi.array().items(Joi.string()))
    .optional(),
  currency: Joi.string().max(3).allow("").uppercase().optional(),
  paid_value: optionalPriceScalar,
  normal_price_value: optionalPriceScalar,
  sale_price_value: optionalPriceScalar,
  rating: Joi.alternatives()
    .try(
      Joi.number().integer().min(0).max(100),
      Joi.string().allow(""),
    )
    .optional(),
  comments_owner: Joi.string().max(500).allow("").optional(),
  shop: Joi.string().max(200).allow("").optional(),
  img_cover: Joi.string().max(2048).allow("").optional(),
  imagefile: Joi.any().optional(),
  access: Joi.string().valid("private", "public", "shared").optional(),
});

export const pointUpdateSchema = Joi.object({
  pos: {
    lat: Joi.number().min(-90).max(90).required(), // -90 to 90
    lon: Joi.number().min(-180).max(180).required(), // -180 to 180
  },
  data: {
    name: Joi.string().min(2).max(20).required(),
    description: Joi.string().max(200),
    imgUrl: Joi.string().uri().optional(),
    categories: Joi.array().items(Joi.string().alphanum().min(1).max(20)), // AI help
  },
});

// Item schemas (MongoDB document: metadata + data)
const itemPriceValueSchema = Joi.object({
  value: Joi.alternatives()
    .try(Joi.number().min(0), Joi.string().allow(""))
    .optional(),
});

const itemPriceSchema = Joi.object({
  currency: Joi.string().max(3).uppercase().allow("").optional(),
  normal_price: itemPriceValueSchema.optional(),
  sale_price: itemPriceValueSchema.optional(),
  paid: itemPriceValueSchema.optional(),
});

const itemTimeSchema = Joi.object({
  created: Joi.alternatives()
    .try(Joi.date(), Joi.string().allow(""))
    .optional(),
  edited: Joi.alternatives()
    .try(Joi.date(), Joi.string().allow(""))
    .optional(),
  deleted: Joi.alternatives()
    .try(Joi.date(), Joi.string().allow(""))
    .optional(),
});

const itemRatingSchema = Joi.object({
  owner: Joi.number().integer().min(0).max(100).optional(),
  others: Joi.array().items(Joi.number().integer().min(0).max(100)).optional(),
});

const itemCommentsSchema = Joi.object({
  owner: Joi.string().max(500).allow("").optional(),
  others: Joi.array().items(Joi.string().max(500)).optional(),
});

const itemDataSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow("").optional(),
  price: itemPriceSchema.optional(),
  collections: Joi.array().items(Joi.string()).optional(),
  categories: Joi.array().items(Joi.string().min(1).max(80)).optional(),
  rating: itemRatingSchema.optional(),
  comments: itemCommentsSchema.optional(),
  shop: Joi.string().allow("").optional(),
  img: Joi.object({
    cover: Joi.string().max(2048).allow("").optional(),
    pictures: Joi.array().items(Joi.string().max(2048).allow("")).optional(),
  }).optional(),
});

const itemMetadataSchema = Joi.object({
  time: itemTimeSchema.optional(),
  owner: Joi.string().required(),
  access: Joi.string().valid("private", "public", "shared").required(),
});

export const itemSchema = Joi.object({
  _id: Joi.any().optional(),
  metadata: itemMetadataSchema.required(),
  data: itemDataSchema.required(),
}).unknown(true);

const collectionItemIdsField = Joi.alternatives()
  .try(Joi.string(), Joi.array().items(Joi.string()))
  .optional();

/** POST `/collections/create` and `collectionsStore.addCollection` input. */
export const createCollectionFormSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  privacy: Joi.string().valid("private", "shared").optional(),
  item_ids: collectionItemIdsField,
  owner: Joi.string().optional(),
});

/** POST `/collections/{id}/edit` and `collectionsStore.editCollection` updates. */
export const editCollectionFormSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  privacy: Joi.string().valid("private", "shared").optional(),
  item_ids: collectionItemIdsField,
});

const collectionDataSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  privacy: Joi.string().valid("private", "shared").required(),
  items: Joi.array().items(Joi.string()).optional(),
});

const collectionMetadataSchema = Joi.object({
  owner: Joi.string().required(),
  time: itemTimeSchema.optional(),
});

/** Full MongoDB collection document shape (metadata + data). */
export const collectionSchema = Joi.object({
  metadata: collectionMetadataSchema.required(),
  data: collectionDataSchema.required(),
}).unknown(true);
