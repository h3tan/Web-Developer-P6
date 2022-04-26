const Sauce = require("../models/Sauce");
const fs = require("fs");

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: [],
  });
  sauce
    .save()
    .then(() => {
      res.status(201).json({
        message: "Sauce ajouté à la base de données",
      });
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

async function findSauce(id) {
  return await Sauce.findOne({ _id: id });
}

exports.getOneSauce = async (req, res, next) => {
  const sauce = await findSauce(req.params.id);
  if (sauce) {
    res.status(200).json(sauce);
  } else {
    res.status(404).json({ error: "Sauce inexistante !" });
  }
};

/* exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
}; */

exports.modifySauce = async (req, res, next) => {
  const sauce = await findSauce(req.params.id);
  if (!sauce) {
    res.status(404).json({
      error: new Error("Sauce does not exist!"),
    });
  }
  if (sauce.userId !== req.auth.userId) {
    res.status(400).json({
      error: new Error("Unauthorized request!"),
    });
  } else {
    const sauceObject = req.file
      ? {
          ...JSON.parse(req.body.sauce),
          imageUrl: `${req.protocol}://${req.get("host")}/images/${
            req.file.filename
          }`,
        }
      : { ...req.body };
    const filename = sauce.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => {
      Sauce.updateOne(
        { _id: req.params.id },
        { _id: req.params.id, ...sauceObject }
      ).then(() => {
        res.status(201).json({
          message: "Informations de la sauce modifiées !",
        });
      });
    });
  }
};

exports.deleteSauce = async (req, res, next) => {
  const sauce = await findSauce(req.params.id);
  if (!sauce) {
    res.status(404).json({
      error: new Error("Sauce does not exist!"),
    });
  }
  if (sauce.userId !== req.auth.userId) {
    res.status(400).json({
      error: new Error("Unauthorized request!"),
    });
  } else {
    const filename = sauce.imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => {
      Sauce.deleteOne({ _id: req.params.id }).then(() => {
        res.status(200).json({
          message: "Sauce Supprimé !",
        });
      });
    });
  }
};

exports.getAllSauce = async (req, res, next) => {
  try {
    Sauce.find()
      .then((sauces) => {
        res.status(200).json(sauces);
      })
      .catch((error) => {
        res.status(400).json({
          error: error,
        });
      });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

exports.likeSauce = (req, res, next) => {
  const userId = req.body.userId;
  const like = req.body.like;
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    switch (like) {
      case 1: // Cas où l'utilisateur veut liker
        if (
          !sauce.usersLiked.includes(userId) &&
          !sauce.usersDisliked.includes(userId)
        ) {
          sauce.usersLiked.addToSet(userId);
          sauce.likes = sauce.usersLiked.length;
          Sauce.updateOne(
            { _id: sauce.id },
            {
              likes: sauce.likes,
              usersLiked: sauce.usersLiked,
            }
          ).then(() => {
            res.status(200).json({ message: "Sauce Liked !" });
          });
        } else {
          res
            .status(400)
            .json({ message: "User has already like or dislike this sauce !" });
        }
        break;
      case -1: // Cas où l'utilisateur veut disliker
        if (
          !sauce.usersLiked.includes(userId) &&
          !sauce.usersDisliked.includes(userId)
        ) {
          sauce.usersDisliked.addToSet(userId);
          sauce.likes = sauce.usersDisliked.length;
          Sauce.updateOne(
            { _id: sauce.id },
            {
              dislikes: sauce.dislikes,
              usersDisliked: sauce.usersDisliked,
            }
          ).then(() => {
            res.status(200).json({ message: "Sauce Disliked !" });
          });
        } else {
          res
            .status(400)
            .json({ message: "User has already like or dislike this sauce !" });
        }
        break;
      case 0: // Cas où l'utilisateur annule son like ou dislike
        // Annulation du like
        if (sauce.usersLiked.includes(userId)) {
          sauce.usersLiked.pull(userId);
          sauce.likes = sauce.usersLiked.length;
          Sauce.updateOne(
            { _id: sauce.id },
            {
              likes: sauce.likes,
              usersLiked: sauce.usersLiked,
            }
          ).then(() => {
            res.status(200).json({ message: "Like cancelled !" });
          });
          break;
          // Annulation du dislike
        } else {
          sauce.usersDisliked.pull(userId);
          sauce.Dislikes = sauce.usersDisliked.length;
          Sauce.updateOne(
            { _id: sauce.id },
            {
              dislikes: sauce.dislikes,
              usersDisliked: sauce.usersDisliked,
            }
          ).then(() => {
            res.status(200).json({ message: "Dislike cancelled !" });
          });
          break;
        }
      default:
        res.status(400).json({ message: "Valeur de like non conforme" });
    }
  });
};
