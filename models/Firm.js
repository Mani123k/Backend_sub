const mongoose = require('mongoose');
const firmSchema = new mongoose.Schema({
    firstName: {
        type: String,
        unique: true,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    category: {
        type: [{
                type: String,
                enum: ['veg', 'non-veg']
            }

        ]
    },
    region: [{
        type: String,
        enum: ['south-indian', 'north-indian', 'chinese', 'bakery']

    }],
    offer: {
        type: String,
    },
    image: {
        type: String
    },
    vendor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendor'
    }],
    product: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'

    }]


})
const Firm = mongoose.model('Firm', firmSchema);
module.exports = Firm;