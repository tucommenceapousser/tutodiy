const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");

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
      {
        id: 1,
        title: "Fabriquer un électro-aimant DIY",
        description: "Un projet simple pour expulser une tige de fer.",
        link: "https://fr.wikihow.com/fabriquer-un-%C3%A9lectroaimant"
      },
    ],
  });
});

// Fonction de scraping de la page WikiHow
async function scrapeTutorial(url) {
  try {
    const { data } = await axios.get(url);  // Récupérer le HTML de la page
    const $ = cheerio.load(data);  // Charger le HTML avec Cheerio

    // Extraire les étapes du tutoriel
    const steps = [];
    $(".step").each((index, element) => {
      steps.push($(element).text().trim());
    });

    // Extraire les images
    const images = [];
    $(".step img").each((index, element) => {
      const imageUrl = $(element).attr("src");
      if (imageUrl) {
        images.push(imageUrl.startsWith("http") ? imageUrl : `https:${imageUrl}`);
      }
    });

    return { steps, images };
  } catch (error) {
    console.error("Erreur lors du scraping :", error);
    return { steps: [], images: [] };  // Retourner des tableaux vides en cas d'erreur
  }
}

// Page d'un tutoriel (scraping de la page)
app.get("/tutorial/:id", async (req, res) => {
  const tutorial = {
    1: {
      title: "Fabriquer un électro-aimant DIY",
      link: "https://fr.wikihow.com/fabriquer-un-%C3%A9lectroaimant"
    }
  };

  const tutorialData = tutorial[req.params.id];
  if (!tutorialData) {
    return res.status(404).send("Tutoriel introuvable.");
  }

  // Scraper les étapes et les images
  const { steps, images } = await scrapeTutorial(tutorialData.link);
  tutorialData.steps = steps;
  tutorialData.images = images;

  res.render("tutorial", tutorialData);
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
    console.error("Erreur GPT-4 :", error.response?.data || error.message);
    res.json({ answer: "Erreur avec GPT-4. Essayez plus tard." });
  }
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
