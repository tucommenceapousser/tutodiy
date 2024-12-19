const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configuration GPT-4
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Page d'accueil
app.get("/", (req, res) => {
  res.render("index", {
    tutorials: [
      { id: 1, title: "Fabriquer un électro-aimant DIY", description: "Un projet simple pour expulser une tige de fer." },
    ],
  });
});

// Page d'un tutoriel
app.get("/tutorial/:id", (req, res) => {
  const tutorials = {
    1: {
      title: "Fabriquer un électro-aimant DIY",
      description: "Utilisez une alimentation d'ancien téléphone pour créer un électro-aimant.",
      steps: [
        "Récupérez une alimentation de téléphone (5-12V).",
        "Prenez un tube en plastique ou PVC d’environ 10 cm.",
        "Enroulez du fil de cuivre isolé autour du tube (200-300 tours).",
        "Insérez une tige de fer ou un clou dans le tube.",
        "Connectez les extrémités du fil à l'alimentation.",
        "Quand le courant passe, la tige est expulsée du tube.",
      ],
    },
  };
  res.render("tutorial", tutorials[req.params.id]);
});

// GPT-4 Interactivité
app.post("/ask", async (req, res) => {
  const question = req.body.question;
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Un utilisateur demande : ${question}. Répondez comme un guide DIY.`,
      max_tokens: 150,
    });
    res.json({ answer: response.data.choices[0].text.trim() });
  } catch (error) {
    res.json({ answer: "Erreur avec GPT-4. Essayez plus tard." });
  }
});

// Lancer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
