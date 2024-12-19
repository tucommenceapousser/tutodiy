const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const helmet = require("helmet");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();

// Middlewares
app.use(helmet());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Configuration OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Tutoriels disponibles
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

// Page d'accueil
app.get("/", (req, res) => {
  const tutorialList = Object.keys(tutorials).map((id) => ({
    id,
    title: tutorials[id].title,
    description: tutorials[id].description,
  }));
  res.render("index", { tutorials: tutorialList });
});

// Générer des images pour les étapes
async function generateImages(steps) {
  try {
    const imagePromises = steps.map((step) =>
      openai.createImage({
        prompt: `Illustration réaliste DIY : ${step}. Style clair et précis.`,
        n: 1,
        size: "512x512",
      })
    );

    const results = await Promise.all(imagePromises);
    return results.map((response) => response.data.data[0].url);
  } catch (error) {
    console.error("Erreur lors de la génération des images :", error.message);
    return steps.map(() => null); // Placeholder en cas d'échec
  }
}

// Page d'un tutoriel
app.get("/tutorial/:id", async (req, res) => {
  const tutorial = tutorials[req.params.id];
  if (!tutorial) {
    return res.status(404).render("error", { message: "Tutoriel introuvable." });
  }

  try {
    const images = await generateImages(tutorial.steps);
    res.render("tutorial", { ...tutorial, images });
  } catch (error) {
    console.error("Erreur lors de la génération du tutoriel :", error.message);
    res.status(500).render("error", { message: "Une erreur est survenue. Veuillez réessayer plus tard." });
  }
});

// GPT-4 Interactivité
app.post("/ask", async (req, res) => {
  const question = req.body.question;
  if (!question || question.trim() === "") {
    return res.json({ answer: "Veuillez poser une question valide." });
  }

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Un utilisateur demande : ${question}. Répondez comme un guide DIY.`,
      max_tokens: 150,
    });
    res.json({ answer: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error("Erreur GPT-4 :", error.message);
    res.json({ answer: "Erreur avec GPT-4. Essayez plus tard." });
  }
});

// Page d'erreur générique
app.use((req, res) => {
  res.status(404).render("error", { message: "Page introuvable." });
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
