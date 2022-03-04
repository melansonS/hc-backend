import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 8080;
export const NODE_ENV = process.env.NODE_ENV;
export const MONGO_URI = process.env.MONGO_URI;
export const MONGO_DEV_URI = process.env.MONGO_DEV_URI;
export const DB_NAME = process.env.DB_NAME

if(!DB_NAME) {
  console.error("DB_NAME not propertly set..")
}
