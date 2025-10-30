// controllers/productcontroller.js
const Product = require("../models/product");
const Firm = require("../models/Firm");
const mongoose = require('mongoose');

// Helper: normalize incoming category into a JS value (array or string)
function normalizeIncomingCategory(raw) {
    if (Array.isArray(raw)) return raw.map(x => String(x).trim()).filter(Boolean);
    if (raw == null) return [];
    const s = String(raw).trim();

    // Try JSON parse for JSON arrays or strings
    try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(x => String(x).trim()).filter(Boolean);
        if (typeof parsed === 'string') return [parsed.trim()];
    } catch (e) {
        // ignore
    }

    // comma separated fallback
    if (s.includes(',')) return s.split(',').map(x => x.trim()).filter(Boolean);

    // single value fallback
    return [s];
}

function normalizeBoolean(raw) {
    if (typeof raw === 'boolean') return raw;
    const s = String(raw || '').trim().toLowerCase();
    return ['true', '1', 'yes', 'y', 'on'].includes(s);
}

// Main: addProduct
const addProduct = async(req, res) => {
    try {
        // Diagnostics (helpful while developing)
        const catPath = Product.schema.paths && Product.schema.paths.category;
        console.log('--- MODEL DIAGNOSTICS ---');
        console.log('Product.schema.paths.category =', catPath ? catPath : '(not found)');
        if (catPath) {
            console.log('  instance:', catPath.instance); // 'Array' or 'String'
            if (catPath.caster) console.log('  caster.instance:', catPath.caster.instance);
            if (catPath.enumValues && catPath.enumValues.length) console.log('  enumValues:', catPath.enumValues);
        }
        console.log('Registered mongoose models:', Object.keys(mongoose.models));
        console.log('-------------------------');

        // Log incoming payload
        console.log('raw req.body:', req.body);
        const { productName, price, category: rawCategory, bestSeller: rawBestSeller, description } = req.body;
        const image = req.file ? req.file.filename : undefined;
        const firmId = req.params.firmId;

        // Normalize incoming category into array form for easier handling
        const incomingCategoryArray = normalizeIncomingCategory(rawCategory);
        console.log('incomingCategoryArray ->', incomingCategoryArray);

        // Decide what the model expects for category
        let categoryForModel;
        if (catPath && catPath.instance === 'String') {
            // model expects a single string => pick first element or fail
            if (!incomingCategoryArray.length) {
                return res.status(400).json({ error: 'category is required' });
            }
            categoryForModel = String(incomingCategoryArray[0]); // take the first value
        } else {
            // model expects array (or unknown) => pass array
            categoryForModel = incomingCategoryArray;
        }

        // If enum is defined on the schema as allowed values, validate here
        if (catPath && Array.isArray(catPath.enumValues) && catPath.enumValues.length) {
            const allowed = catPath.enumValues;
            if (typeof categoryForModel === 'string') {
                if (!allowed.includes(categoryForModel)) {
                    return res.status(400).json({ error: `category must be one of: ${allowed.join(', ')}` });
                }
            } else if (Array.isArray(categoryForModel)) {
                const invalid = categoryForModel.filter(c => !allowed.includes(c));
                if (invalid.length) {
                    return res.status(400).json({ error: `invalid category values: ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}` });
                }
            }
        }

        const bestSeller = normalizeBoolean(rawBestSeller);
        const priceStr = (typeof price === 'undefined' || price === null) ? '' : String(price).trim();

        // Basic validation
        if (!productName || !String(productName).trim()) return res.status(400).json({ error: 'productName is required' });
        if (!priceStr) return res.status(400).json({ error: 'price is required' });

        // Firm existence check
        const firm = await Firm.findById(firmId);
        if (!firm) return res.status(404).json({ error: 'No firm found' });

        // Build product object to pass to mongoose model
        const productObj = {
            productName: String(productName).trim(),
            price: priceStr,
            category: categoryForModel,
            bestSeller,
            description: description ? String(description).trim() : undefined,
            image,
            firm: firm._id
        };

        console.log('productObj being passed to new Product():', productObj);

        // Create & save
        const product = new Product(productObj);
        const savedProduct = await product.save();

        // Add product id to firm.products array if available on Firm
        if (Array.isArray(firm.products)) {
            firm.products.push(savedProduct._id);
            await firm.save();
        }

        return res.status(201).json({ message: 'Product created', product: savedProduct });
    } catch (error) {
        console.error('addProduct error:', error);

        if (error.name === 'ValidationError') {
            const details = {};
            for (const [k, v] of Object.entries(error.errors || {})) details[k] = v.message;
            return res.status(400).json({ message: 'Validation failed', errors: details });
        }

        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// GET products by firm id
const getProductByFirm = async(req, res) => {
    try {
        const firmId = req.params.firmId;
        if (!firmId) return res.status(400).json({ error: 'firmId is required' });

        const firm = await Firm.findById(firmId);
        if (!firm) return res.status(404).json({ error: 'Firm not found' });

        const products = await Product.find({ firm: firmId }).lean().exec();
        return res.status(200).json({ products });
    } catch (error) {
        console.error('getProductByFirm error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

// DELETE product by id
const deleteProductById = async(req, res) => {
    try {
        const productId = req.params.productId;
        if (!productId) return res.status(400).json({ error: 'productId is required' });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        if (product.firm) {
            try {
                const firm = await Firm.findById(product.firm);
                if (firm && Array.isArray(firm.products)) {
                    firm.products = firm.products.filter(pid => String(pid) !== String(product._id));
                    await firm.save();
                }
            } catch (e) {
                console.warn('Failed to update firm.products while deleting product:', e.message);
            }
        }

        await Product.findByIdAndDelete(productId);
        return res.status(200).json({ message: 'Product deleted' });
    } catch (error) {
        console.error('deleteProductById error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};

module.exports = {
    addProduct,
    getProductByFirm,
    deleteProductById
};