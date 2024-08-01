import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api", // URL of the API
  withCredentials: true, // Send cookies when making requests
});
