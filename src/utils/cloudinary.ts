import { v2 as cloudinary } from "cloudinary";
import { unlink } from "node:fs/promises";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!, 
  secure: true,
});

export const uploadToCloudinary = async (filePath: string) => {
  if (!filePath) throw new Error("filePath is required");

  try {
    const response = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    // Delete local file after successful upload
    await unlink(filePath);

    return response;
  } catch (error) {
    try {
      await unlink(filePath);
    } catch {}
    throw error;
  }
};
