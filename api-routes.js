import { userApi } from "./src/api/user-api.js";
import { pointApi } from "./src/api/point-api.js";

export const apiRoutes = [
// User API routes
  { method: "POST", path: "/api/users", config: userApi.create },
  { method: "GET", path: "/api/users/getAll", config: userApi.getAll },
  { method: "GET", path: "/api/users/getOne", config: userApi.getOne },
  { method: "PATCH", path: "/api/users", config: userApi.update },
  { method: "DELETE", path: "/api/users", config: userApi.delete },

// Points API routes
  { method: "POST", path: "/api/points", config: pointApi.create },
];
