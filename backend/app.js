const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const sauceRoutes = require("./routes/sauce");
const userRoutes = require("./routes/user");
const path = require("path");
const app = express();
const helmet = require("helmet");

// Utilisation des variables d'environnement
const MY_ID = process.env.MONGODB_ID;
const MY_PASSWORD = process.env.MONGODB_PASSWORD;
const MY_CLUSTER = process.env.MONGODB_CLUSTER_NAME;
const MY_DATABASE = process.env.MONGODB_DATABASE_NAME;

mongoose
  .connect(
    `mongodb+srv://${MY_ID}:${MY_PASSWORD}@${MY_CLUSTER}.wqmvs.mongodb.net/${MY_DATABASE}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use(express.json());
app.use(helmet());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

app.use("/api/sauces", sauceRoutes);

app.use("/api/auth", userRoutes);

app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;
