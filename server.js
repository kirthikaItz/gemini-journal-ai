const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static assets directly from the project root
app.use(express.static(__dirname));

// Ensure the root path opens index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Secure endpoint providing Firebase config from server environment variables
app.get('/api/config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
  });
});

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Multi-turn journaling endpoint
app.post('/api/journal', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are an empathetic, insightful personal journaling mentor. 
Guide the user through reflection, ask one thoughtful follow-up question, and offer concise encouraging perspective.
Past context: ${JSON.stringify(history || [])}
Current user thought: ${prompt}`
            }
          ]
        }
      ]
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Error contacting Gemini API:', error);
    res.status(500).json({ error: 'Failed to process reflection with Gemini.' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Application running at http://localhost:${PORT}`);
});