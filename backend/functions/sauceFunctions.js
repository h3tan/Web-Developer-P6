const Sauce = require("../models/Sauce");

exports.updateSauce = (req, res, sauceInformations) => {
  Sauce.updateOne(
    { _id: req.params.id },
    {
      ...sauceInformations,
      likes: req.params.likes, // Empêche de modifier les likes et dislikes en passant par d'autres méthodes que le front-end
      dislikes: req.params.dislikes,
      usersLiked: req.params.usersLiked,
      usersDisliked: req.params.usersDisliked,
    }
  ).then(() =>
    res.status(201).json({ message: "Sauce's informations modified" })
  );
};

exports.modifyLikeOrDislike = (id, sauce, like, res) => {
  if (!sauce.usersLiked.includes(id) && !sauce.usersDisliked.includes(id)) {
    if (like == 1) {
      sauce.usersLiked.addToSet(id);
      return "Sauce Liked !";
    } else {
      sauce.usersDisliked.addToSet(id);
      return "Sauce Disliked !";
    }
  }
  return false;
};

exports.cancelLikeOrDislike = (id, sauce, res) => {
  if (sauce.usersLiked.includes(id)) {
    sauce.usersLiked.pull(id);
    return "Like Cancelled !";
  }
  if (sauce.usersDisliked.includes(id)) {
    sauce.usersDisliked.pull(id);
    return "Dislike Cancelled !";
  }
  return false;
};
