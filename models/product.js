const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: ['veg', 'non-veg'], required: true },
    image: { type: String },
    bestSeller: { type: Boolean, default: false },
    description: { type: String },
    firm: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Firm' }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;