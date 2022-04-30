const Sauce = require("../models/Sauce");
const fs = require("fs");
const sauceFct = require("../functions/sauceFunctions");

/* Créé une sauce à partir d'une requête, une sauce peut être créé si aucune image n'est fournie,
initialise "heat" à 1 si l'utilisateur entre une valeur non conforme et initialise les likes, dislikes à 0
et les tableaux usersLiked et usersDisliked en tableaux vides
*/
exports.createSauce = (req, res, next) => {
  let file = "";
  let sauceObject = req.body;
  if (req.file) {
    sauceObject = JSON.parse(req.body.sauce);
    file = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;
  }
  if (req.body.heat < 1 || req.body.heat > 10) {
    req.body.heat = 1;
  }
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: file,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  try {
    sauce.save();
    res.status(201).json({
      message: "Sauce added to database",
    });
  } catch (error) {
    res.status(400).json({
      error: error,
    });
  }
};

/* Récupère toutes les sauces */
exports.getAllSauce = async (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

/* Récupère une sauce */
exports.getOneSauce = async (req, res, next) => {
  const sauce = await Sauce.findOne({ _id: req.params.id });
  if (sauce) {
    res.status(200).json(sauce);
  } else {
    res.status(404).json({ error: new Error("Sauce does not exist") });
  }
};

/* Modifie une sauce, si un fichier image est présent, remplace le précédent après l'avoir supprimé
sinon le fichier image déjà présent est gardé
Seul l'utilisateur ayant créé la sauce peut la supprimer
*/
exports.modifySauce = async (req, res, next) => {
  const sauce = await Sauce.findOne({ _id: req.params.id });
  if (!sauce) {
    res.status(404).json({
      error: new Error("Sauce does not exist"),
    });
    return;
  }
  if (sauce.userId !== req.auth.userId) {
    res.status(403).json({
      error: "Unauthorised User",
    });
    return;
  }
  if (!req.file) {
    sauceFct.updateSauce(req, res, req.body);
  } else {
    const sauceObject = {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    };
    const filename = sauce.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => {
      sauceFct.updateSauce(req, res, sauceObject);
    });
  }
};

/* Supprime une sauce
Seul l'utilisateur ayant créé la sauce peut la supprimer
*/
exports.deleteSauce = async (req, res, next) => {
  const sauce = await Sauce.findOne({ _id: req.params.id });
  if (!sauce) {
    res.status(404).json({
      error: new Error("Sauce does not exist"),
    });
  }
  if (sauce.userId !== req.auth.userId) {
    res.status(403).json({
      error: "Unauthorised User",
    });
  } else {
    if (!sauce.imageUrl) {
      sauce
        .deleteOne({ _id: req.params.id })
        .then(() => res.status(204).json("Sauce deleted"));
    } else {
      const filename = sauce.imageUrl.split("/images/")[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id }).then(() => {
          res.status(200).json({ message: "Sauce deleted" });
        });
      });
    }
  }
};

/* Gestion des likes
Un utilisateur ayant déjà liké une sauce ne peut la disliker ou la liker à nouveau,
Pour liker/disliker à nouveau, l'utilisateur doit d'abord annuler son like/dislike
*/
exports.likeSauce = async (req, res, next) => {
  const userId = req.body.userId;
  const like = req.body.like;
  const sauce = await Sauce.findOne({ _id: req.params.id });
  if (!sauce) {
    res.status(400).json({ error: new Error("Sauce does not exist") });
  }
  let confirmMessage = "";
  switch (like) {
    case 1:
      if (
        !sauce.usersLiked.includes(userId) &&
        !sauce.usersDisliked.includes(userId)
      ) {
        sauce.usersLiked.addToSet(userId);
        confirmMessage = "Sauce Liked !";
      } else {
        res.status(400).json({ error: "Sauce already liked or disliked!" });
        return;
      }
      break;
    case -1:
      if (
        !sauce.usersLiked.includes(userId) &&
        !sauce.usersDisliked.includes(userId)
      ) {
        sauce.usersDisliked.addToSet(userId);
        confirmMessage = "Sauce Disliked !";
      } else {
        res.status(400).json({ error: "Sauce already liked or disliked!" });
        return;
      }
      break;
    case 0:
      if (sauce.usersLiked.includes(userId)) {
        sauce.usersLiked.pull(userId);
        confirmMessage = "Like Cancelled !";
        break;
      }
      if (sauce.usersDisliked.includes(userId)) {
        sauce.usersDisliked.pull(userId);
        confirmMessage = "Dislike Cancelled !";
        break;
      }
      res.status(400).json({ error: "No like or dislike to cancel" });
      return;
    default:
      res.status(400).json({ error: "Incorrect value of like !" });
      return;
  }
  Sauce.updateOne(
    { _id: sauce.id },
    {
      likes: sauce.usersLiked.length,
      usersLiked: sauce.usersLiked,
      dislikes: sauce.usersDisliked.length,
      usersDisliked: sauce.usersDisliked,
    }
  ).then(() => {
    res.status(200).json({ message: confirmMessage });
  });
};