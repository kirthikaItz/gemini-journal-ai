const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Multi-turn journaling endpoint
app.post('/api/journal', async (req, res) => {
  try {
    const { prompt, history } = req.body;

    // Custom System Instructions for the Reflective Journal Coach
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
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