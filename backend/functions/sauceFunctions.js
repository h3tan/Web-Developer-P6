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

exports.addLike = (id, sauce, res) => {
  if (!sauce.usersLiked.includes(id) && !sauce.usersDisliked.includes(id)) {
    sauce.usersLiked.addToSet(id);
    sauce.likes = sauce.usersLiked.length;
    Sauce.updateOne(
      { _id: sauce.id },
      { likes: sauce.likes, usersLiked: sauce.usersLiked }
    ).then(() => res.status(200).json({ message: "Sauce Liked !" }));
  } else {
    res
      .status(400)
      .json({ message: "User has already like or dislike this sauce !" });
  }
};

exports.addDislike = (id, sauce, res) => {
  if (!sauce.usersLiked.includes(id) && !sauce.usersDisliked.includes(id)) {
    sauce.usersDisliked.addToSet(id);
    sauce.dislikes = sauce.usersDisliked.length;
    Sauce.updateOne(
      { _id: sauce.id },
      { dislikes: sauce.dislikes, usersDisliked: sauce.usersDisliked }
    ).then(() => res.status(200).json({ message: "Sauce Disliked !" }));
  } else {
    res
      .status(400)
      .json({ message: "User has already like or dislike this sauce !" });
  }
};

exports.cancelLike = (id, sauce, res) => {
  sauce.usersLiked.pull(id);
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
};

exports.cancelDislike = (id, sauce, res) => {
  sauce.usersDisliked.pull(id);
  sauce.dislikes = sauce.usersDisliked.length;
  Sauce.updateOne(
    { _id: sauce.id },
    {
      dislikes: sauce.dislikes,
      usersDisliked: sauce.usersDisliked,
    }
  ).then(() => {
    res.status(200).json({ message: "Dislike cancelled !" });
  });
};
