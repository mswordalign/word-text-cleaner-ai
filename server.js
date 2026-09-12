const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.send('Word Text Cleaner AI backend is running.');
});

app.post('/clean', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'No text provided.' });
    }

    const prompt = `Fix this text pasted from a PDF: merge broken line-breaks into flowing paragraphs, fix accidentally joined words caused by missing spaces (e.g. "IndianArmy" -> "Indian Army", "now.Kodavus" -> "now. Kodavus"), and keep the original wording and paragraph count exactly as it would appear in a printed book. Do not rephrase, summarize, or change any words. Return ONLY the cleaned text, with no explanation, no preamble, and no markdown formatting.\n\nTEXT TO FIX:\n${text}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return res.status(500).json({ error: 'Gemini API request failed.' });
    }

    const data = await response.json();
    const cleaned = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!cleaned) {
      return res.status(500).json({ error: 'No response from Gemini.' });
    }

    res.json({ cleaned: cleaned.trim() });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
