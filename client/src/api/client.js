import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_URL is not defined");
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});
