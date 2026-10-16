import cloudinary from "cloudinary";
import { requireEnvironmentVariable } from "./env";

cloudinary.v2.config({
    cloud_name: requireEnvironmentVariable("CLOUDINARY_NAME", process.env.CLOUDINARY_NAME),
    api_key: requireEnvironmentVariable("CLOUDINARY_API_KEY", process.env.CLOUDINARY_API_KEY),
    api_secret: requireEnvironmentVariable("CLOUDINARY_API_SECRET", process.env.CLOUDINARY_API_SECRET)
})

export default cloudinary