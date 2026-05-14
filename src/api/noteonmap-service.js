import axios from "axios";

export const noteOnMapService = {
    noteOnMapUrl:process.env.SERVICE_URL,

  async createUser(user) {
    // console.log(`[ NOM API Service ] create user POST link: ${this.noteOnMapUrl}/api/users`, user);
    const res = await axios.post(`${this.noteOnMapUrl}/api/users`, user);
    return res.data;
  },

  async getUserById(uid) {
    // console.log(`[ NOM API Service ] get user GET link: ${this.noteOnMapUrl}/api/users/getOne`, { params: { id: uid } });
    const res = await axios.get(`${this.noteOnMapUrl}/api/users/getOne`, { params: { id: uid } });
    return res.data;
  },
  async updateUserById(uid, user) {
    // console.log(`[ NOM API Service ] update user PATCH link: ${this.noteOnMapUrl}/api/users`, { params: { id: uid } }, user);
    const res = await axios.patch(`${this.noteOnMapUrl}/api/users`, user, { params: { id: uid } });
    return res.data;
  },
  async deleteUserById(uid) {
    // console.log(`[ NOM API Service ] delete user DELETE link: ${this.noteOnMapUrl}/api/users`, { params: { id: uid } });
    const res = await axios.delete(`${this.noteOnMapUrl}/api/users`, { params: { id: uid } }); // AI help
    return res.data;
  }
}