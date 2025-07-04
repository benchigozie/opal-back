const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


const env = process.env.NODE_ENV || "development";
dotenv.config({ path: path.resolve(__dirname, `../.env.${env}`) });
//console.log("Trying to load:", path.resolve(__dirname, `../.env.${env}`));
//console.log(`Database URL: ${process.env.DB_USER}`);


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const tokenRoutes = require("./routes/token");
app.use("/api/token", tokenRoutes);


module.exports = app;