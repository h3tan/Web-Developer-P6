const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const checking = require("../middlewares/checking");
const multer = require("../middlewares/multer-config");
const sauceCtrl = require("../controllers/sauce");

router.post("/", auth, multer, sauceCtrl.createSauce);

router.get("/", auth, sauceCtrl.getAllSauce);

router.get("/:id", auth, sauceCtrl.getOneSauce);

router.put(
  "/:id",
  auth,
  checking.sauceExists,
  checking.userRights,
  multer,
  sauceCtrl.modifySauce
);

router.post("/:id/like", auth, sauceCtrl.likeSauce);

router.delete(
  "/:id",
  auth,
  checking.sauceExists,
  checking.userRights,
  sauceCtrl.deleteSauce
);

module.exports = router;
