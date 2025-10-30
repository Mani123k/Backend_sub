const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const vendorRoutes = require("./routes/vendorRoutes");
const firmroutes = require("./routes/firmroute");
const productRoutes = require('./routes/productRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json()); // parses JSON
app.use(express.urlencoded({ extended: true })); // parses form data

// Routes
app.use("/vendor", vendorRoutes);
app.use("/firm", firmroutes);
app.use("/product", productRoutes);

// MongoDB connection
mongoose
    .connect(process.env.Mongodb_url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.log("MongoDB connection error:", error));

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});