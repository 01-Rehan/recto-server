import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;

    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    // console.log("File is uploaded on Cloudinary: ", response.url);

    // OPTIMIZATION: fs.promises to avoid blocking the event loop
    await fs.promises.unlink(localFilePath);
    return response;
  } catch (error) {
    console.error("Error during Cloudinary upload:", error);
    // Remove the locally saved temporary file as the upload operation got failed
    // We attempt to unlink, but we don't care if it fails (e.g., file doesn't exist).
    // The 'finally' block ensures this runs regardless of success or failure of the unlink.
    await fs.promises.unlink(localFilePath).catch(() => {}); // Attempt cleanup
    return null;
  }
};

const deleteFromCloudinary = async (publicUrl: string) => {
  try {
    // 1. Check if the URL is a valid string and if it's a Cloudinary URL
    if (!publicUrl || !publicUrl.includes("cloudinary.com")) {
      // console.log("Not a Cloudinary URL, skipping delete:", publicUrl);
      return;
    }

    // 2. Extract the public_id from the URL.
    // Example: https://res.cloudinary.com/demo/image/upload/v1629280243/folder/my_image.jpg
    // The public_id is "folder/my_image"
    const publicIdMatch = publicUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);

    if (publicIdMatch && publicIdMatch[1]) {
      const publicId = publicIdMatch[1];
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
};

export { uploadOnCloudinary , deleteFromCloudinary };
