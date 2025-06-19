// backend/chatbot.js
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const { SessionsClient } = require("@google-cloud/dialogflow");
const uuid = require("uuid");


const app = express();
app.use(bodyParser.json());
app.use(cors()); // 🛠️ This line allows cross-origin requests

const projectId = "virtualclassroombot-uavl"; // 🛑 Replace this
const keyFilePath = "./dialogflow-key.json"; // Keep file in same folder

const sessionClient = new SessionsClient({ keyFilename: keyFilePath });

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  const sessionId = uuid.v4();

  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: "en-US",
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    res.json({ reply: result.fulfillmentText });
  } catch (error) {
    console.error("Dialogflow error:", error);
    res.status(500).send("Something went wrong.");
  }
});

app.listen(5000, () => {
  console.log("Chatbot server running on http://localhost:5000");
});
