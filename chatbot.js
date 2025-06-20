// backend/chatbot.js
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const { SessionsClient } = require("@google-cloud/dialogflow");
const uuid = require("uuid");
const { TranslationServiceClient } = require('@google-cloud/translate').v3;


const app = express();
app.use(bodyParser.json());
app.use(cors());

// ✅ Load Dialogflow credentials from Render environment variable
const credentials = JSON.parse(process.env.DIALOGFLOW_KEY_JSON);
const projectId = credentials.project_id;

const sessionClient = new SessionsClient({
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  }
});

const translateClient = new TranslationServiceClient({
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  }
});

// Translate helper
async function translateText(text, targetLanguage) {
  const request = {
    parent: `projects/${projectId}/locations/global`,
    contents: [text],
    mimeType: 'text/plain',
    targetLanguageCode: targetLanguage,
  };
  const [response] = await translateClient.translateText(request);
  return response.translations[0].translatedText;
}


app.post("/chat", async (req, res) => {
  const { message, language } = req.body; // Get language too
  const sessionId = uuid.v4();

  try {
    const responses = await sessionClient.detectIntent({
      session: sessionClient.projectAgentSessionPath(projectId, sessionId),
      queryInput: {
        text: { text: message, languageCode: "en-US" }
      }
    });

    const botReply = responses[0].queryResult.fulfillmentText;

    // Translate if language is not English
    const replyToUser = language && language !== "en"
      ? await translateText(botReply, language)
      : botReply;

    res.json({ reply: replyToUser });

  } catch (error) {
    console.error("Dialogflow error:", error);
    res.status(500).send("Something went wrong.");
  }
});

app.listen(5000, () => {
  console.log("Chatbot server running on http://localhost:5000");
});
