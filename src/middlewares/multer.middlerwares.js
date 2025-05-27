import multer from "multer";

// keep uploads in memory so we can stream them straight to Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({ storage });
