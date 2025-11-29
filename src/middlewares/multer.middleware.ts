import multer from "multer";
import path from "path";
import fs from "fs";

const tempDir = path.join(process.cwd(), "public", "temp");

// Ensure directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = file.fieldname;
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${base}-${unique}${ext}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  // example: only images
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Invalid file type"), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
