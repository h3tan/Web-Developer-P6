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

/* Récupère une sauce
  L'existence de la sauce dans la base de données est traitée par le middleware "checking.sauceExists"
*/
exports.getOneSauce = async (req, res, next) => {
  res.status(200).json(req.sauceFound);
}

/* Modifie une sauce, si un fichier image est présent, remplace le précédent après l'avoir supprimé
sinon le fichier image déjà présent est gardé
*/
exports.modifySauce = async (req, res, next) => {
  let sauceObject = req.body;
  if (req.file) {
    sauceObject = {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    }
    const filename = req.sauceFound.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => {
      console.log(`${filename} deleted`)
    });
  }
  sauceFct.updateSauce(req, res, sauceObject);
};

/* Supprime une sauce
L'existence de la sauce dans la base de données est traitée par le middleware "checking.sauceExists"
*/
exports.deleteSauce = async (req, res, next) => {
  if (req.sauceFound.imageUrl) {
    const filename = req.sauceFound.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => { console.log(`${filename} deleted`)});
  }
  Sauce.deleteOne({ _id: req.params.id })
  .then(() => {res.status(200).json({ message: "Sauce deleted" });
  });
};

/* Gestion des likes
Un utilisateur ayant déjà liké une sauce ne peut la disliker ou la liker à nouveau,
Pour liker/disliker à nouveau, l'utilisateur doit d'abord annuler son like/dislike
*/
exports.updatelikeOrDislike = async (req, res, next) => {
  const userId = req.body.userId;
  const like = req.body.like;
  const sauce = req.sauceFound;
  let confirmMessage = "";
  switch (like) {
    case 1:
      confirmMessage = sauceFct.modifyLikeOrDislike(userId, sauce, like, res);
      break;
    case -1:
      confirmMessage = sauceFct.modifyLikeOrDislike(userId, sauce, like, res);
      break;
    case 0:
      confirmMessage = sauceFct.cancelLikeOrDislike(userId, sauce, res);
      if (!confirmMessage) {
        res.status(400).json({ error: "No like or dislike to cancel" });
      } else {
        break;
      }
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
    if (!confirmMessage) {
      res.status(400).json({ message: 'Sauce already liked or disliked !' });
    } else {
      res.status(200).json({ message: confirmMessage });
    }
  });
};