const Firm = require('../models/Firm');
const Vendor = require('../models/vendor');


const addFirm = async(req, res) => {
    try {
        const { firstName, area, category, region, offer } = req.body;

        // ✅ Access uploaded image
        const image = req.file ? req.file.filename : undefined;

        // Find vendor by ID
        const vendor = await Vendor.findById(req.vendorId);
        if (!vendor) {
            return res.status(404).json({ msg: "Vendor not found" });
        }

        // Create new firm
        const firm = new Firm({
            firstName,
            area,
            category,
            region,
            offer,
            image,
            vendor: vendor._id,
        });

        const savedfirm = await firm.save();
        vendor.firm.push(savedfirm)
        vendor.save()
        return res.status(201).json({ msg: "Firm added successfully", firm });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { addFirm };