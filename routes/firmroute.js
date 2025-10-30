const express = require('express');
const router = express.Router();
const firmcontroller = require('../controllers/firmController');
const verifytoken = require('../middlewares/verifyToken');
const multer = require('multer');
const path = require('path');

// 📁 Multer storage config
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// ✅ Route for adding a firm
router.post('/add-firm', verifytoken, upload.single('image'), firmcontroller.addFirm);

module.exports = router;