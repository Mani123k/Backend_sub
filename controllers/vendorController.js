const Vendor = require('../models/vendor')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dotenv = require("dotenv");
dotenv.config();
const secretkey = process.env.MyName;

const vendorRegister = async(req, res) => {
    const { username, email, password } = req.body
    try {
        const existingVendor = await Vendor.findOne({ email })
        if (existingVendor) {
            return res.status(400).json({ msg: 'Email already exists' })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newVendor = new Vendor({
            username,
            email,
            password: hashedPassword
        })
        await newVendor.save()
        res.status(201).json({ msg: 'Vendor registered successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: 'Internal server error' })
    }
}

const vendorLogin = async(req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ msg: 'Email and password required' });

    try {
        const vendorDoc = await Vendor.findOne({ email });
        if (!vendorDoc) return res.status(401).json({ msg: 'Invalid credentials' });

        const passwordMatches = await bcrypt.compare(password, vendorDoc.password);
        if (!passwordMatches) return res.status(401).json({ msg: 'Invalid credentials' });
        const token = jwt.sign({ vendorId: vendorDoc._id }, secretkey, { expiresIn: "1h" });



        return res.status(200).json({ msg: 'Login successful', token });
        console.log(email, token);
    } catch (error) {
        console.error('vendorLogin error:', error);
        return res.status(500).json({ msg: 'Internal server error' });
    }
};
const getallvendors = async(req, res) => {
    try {
        const vendors = await Vendor.find().populate('firm');
        res.json({ vendors });
    } catch (error) {
        console.log('error');
        res.status(500).json({ msg: "Internal Server error" });
    }
};
const getVendorById = async(req, res) => {
    const vendorId = req.params.id;
    try {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ error: "vendor not found" });
        }
        res.status(200).json({ vendor })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server error" });
    }
}
module.exports = { vendorRegister, vendorLogin, getVendorById, getallvendors }