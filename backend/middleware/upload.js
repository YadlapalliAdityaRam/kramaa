const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/doubts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doubt-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Basic image/document filter
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Not an allowed file type. Please upload images or PDFs only.'), false);
    }
};

// Ensure avatar upload directory exists
const avatarUploadDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(avatarUploadDir)) {
    fs.mkdirSync(avatarUploadDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const avatarFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Please upload an image file (PNG, JPG, JPEG, WEBP).'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: avatarFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

module.exports = upload;
module.exports.uploadAvatar = uploadAvatar;
