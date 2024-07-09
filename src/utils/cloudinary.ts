import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiOptions,
} from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (
  localFilePath: string,
  onProgress?: (progress: number) => void
): Promise<(UploadApiResponse & { duration?: number }) | null> => {
  return new Promise((resolve, reject) => {
    try {
      if (!localFilePath) {
        resolve(null);
        return;
      }

      const fileExtension = localFilePath.split(".").pop()?.toLowerCase();
      const isVideo = ["mp4", "mov", "avi", "webm"].includes(
        fileExtension || ""
      );

      const uploadOptions: UploadApiOptions = {
        resource_type: isVideo ? "video" : "auto",
        folder: "MyTube",
        ...(isVideo && {
          eager: [
            {
              transformation: [
                { duration: "$duration" },
                { streaming_profile: "full_hd", format: "m3u8" },
                { streaming_profile: "hd", format: "m3u8" },
                { streaming_profile: "sd", format: "m3u8" },
              ],
            },
          ],
          eager_async: true,
        }),
      };

      let totalBytes = 0;
      let uploadedBytes = 0;

      const upload_stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Error uploading to Cloudinary:", error);
            reject(error);
            return;
          }

          if (result && isVideo) {
            cloudinary.api
              .resource(result.public_id, {
                resource_type: "video",
                image_metadata: true,
              })
              .then((resourceInfo) => {
                resolve({ ...result, duration: resourceInfo.duration });
              })
              .catch((error) => {
                console.error("Error fetching video info:", error);
                resolve(result as UploadApiResponse & { duration?: number });
              });
          } else if (result) {
            resolve(result as UploadApiResponse & { duration?: number });
          } else {
            resolve(null);
          }
        }
      );

      const file_reader = fs.createReadStream(localFilePath);

      file_reader.on("data", (chunk) => {
        uploadedBytes += chunk.length;
        const progress = (uploadedBytes / totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      });

      file_reader.on("end", () => {
        fs.unlinkSync(localFilePath);
      });

      // Get the total file size
      totalBytes = fs.statSync(localFilePath).size;

      // Pipe the file to the upload stream
      file_reader.pipe(upload_stream);
    } catch (error) {
      console.error("Error in uploadOnCloudinary:", error);
      fs.unlinkSync(localFilePath);
      reject(error);
    }
  });
};

export { uploadOnCloudinary };
