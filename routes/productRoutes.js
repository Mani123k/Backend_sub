// routes/productRoutes.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const productController = require("../controllers/productcontroller");

const router = express.Router();

// Multer setup (keeps it in routes so controller only handles logic)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// POST -> upload middleware then controller function (both are functions)
router.post('/add-product/:firmId', upload.single('image'), productController.addProduct);

// Get products by firm
router.get('/:firmId/products', productController.getProductByFirm);

// Serve uploaded images (ensure 'path' is required above)
router.get('/uploads/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    res.header('Content-Type', 'image/jpeg');
    res.sendFile(path.join(__dirname, '..', 'uploads', imageName));
});

// Delete a product
router.delete('/:productId', productController.deleteProductById);

module.exports = router;