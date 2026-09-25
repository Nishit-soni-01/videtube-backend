import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded on cloudinary. File src: " + response.url);

    // Delete the file from local server safely
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // Safely remove the local temporary file if the upload fails
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result  = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary, Public id", publicId)
    } catch (error) {
        console.log("Error deleting from cloudinary", error)
        return null
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };