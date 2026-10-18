const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const uploadDir = path.join(__dirname, '../uploads/reports');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate clean, safe unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for report documents and images
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type (${ext}). Please upload a PDF, DOC/DOCX, or PNG/JPEG image.`));
  }
};

const uploadReport = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max
  },
  fileFilter: fileFilter,
});

module.exports = {
  uploadReport,
  uploadDir,
};
