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
  categories: Joi.array().allow("").optional(), // not ready yet
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
