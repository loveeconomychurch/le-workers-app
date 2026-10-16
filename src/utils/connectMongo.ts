import mongoose from "mongoose";
import { requireEnvironmentVariable } from "./env";

const DB_NAME = requireEnvironmentVariable("DB_NAME", process.env.DB_NAME)
const DB_URL = requireEnvironmentVariable("DB_URL", process.env.DB_URL)
const MONGODB_URI = `${DB_URL.replace(/\/$/, "")}/${DB_NAME}`

export const connectMongo = async () => mongoose.connect(MONGODB_URI) 