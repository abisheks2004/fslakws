const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { matchKeywordInTranscription } = require('../uploadModel');

const uploadRouter = express.Router();
const upload = multer({ dest: 'uploads/' });


uploadRouter.post('/upload', upload.single('audioFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const originalKeyword = req.body.keyword?.trim();
  if (!originalKeyword) {
    // cleanup file if keyword missing
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    // Perform transcription, translation, and keyword matching
    const {
      transcription,
      result,
      matchedKeyword,
      searchedKeywords
    } = await matchKeywordInTranscription(req.file.path, originalKeyword);

    res.json({
      transcription,
      result,
      matchedKeyword,
      searchedKeywords
    });
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    res.status(500).json({ error: 'Failed to process the audio file.' });
  } finally {
    // Always remove the uploaded file
    fs.unlink(req.file.path, () => {});
  }
});

module.exports = uploadRouter;
