const Sauce = require("../models/Sauce");

// Middleware pour vérifier si une sauce dont l'ID est indiquée dans la requête est présente dans la base de donnée
exports.sauceExists = async (req, res, next) => {
  try {
    // Ajout de la sauce trouvée dans la base de donnée dans l'objet req afin de permettre aux autres méthodes de la récupérer
    req.sauceFound = await Sauce.findOne({ _id: req.params.id });
    next();
  } catch {
    res.status(404).json({
      error: "Sauce does not exist",
    });
  }
};

//Middleware pour vérifier si un utilisateur a les droits pour modifier ou supprimer une sauce
exports.userRights = async (req, res, next) => {
  if (req.sauceFound.userId !== req.auth.userId) {
    res.status(403).json({
      error: "Unauthorised User",
    });
  } else {
    next();
  }
};
