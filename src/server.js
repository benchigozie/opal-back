const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


const env = process.env.NODE_ENV; //|| "development";

dotenv.config({ path: path.resolve(__dirname, `../.env.${env}`) });
//console.log("Trying to load:", path.resolve(__dirname, `../.env.${env}`));
//console.log(`Database URL: ${process.env.DB_USER}`);


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CLIENT_URL,
   credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Opal Spaces server is running!");
  });

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const tokenRoutes = require("./routes/token");
app.use("/api/token", tokenRoutes);

const productRoutes = require("./routes/product")
app.use('/api/products', productRoutes);

const reviewRoutes = require('./routes/review');
app.use('/api/reviews', reviewRoutes);

const cartRoutes = require('./routes/cart');
app.use('/api/cart', cartRoutes);

const orderRoutes = require('./routes/order');
app.use('/api/orders', orderRoutes);

const employeeRoutes = require('./routes/employee');
app.use('/api/users', employeeRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT} in ${env} mode`);
});


module.exports = app;