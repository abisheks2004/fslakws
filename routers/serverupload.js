const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { matchKeywordInTranscription } = require('../uploadModel');

const uploadRouter = express.Router();
const upload = multer({ dest: 'uploads/' });

// MULTIPLE files from field name "audioFile"
uploadRouter.post('/upload', upload.array('audioFile'), async (req, res) => {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const originalKeyword = req.body.keyword?.trim();
  if (!originalKeyword) {
    // cleanup all files if keyword missing
    files.forEach((file) => fs.unlink(file.path, () => {}));
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    // Process each file individually
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const {
            transcription,
            result,
            matchedKeyword,
            searchedKeywords
          } = await matchKeywordInTranscription(file.path, originalKeyword);

          return {
            fileName: file.originalname,
            transcription,
            result,
            matchedKeyword,
            searchedKeywords
          };
        } catch (err) {
          console.error(`❌ Error processing file ${file.originalname}:`, err.message);
          return {
            fileName: file.originalname,
            error: 'Failed to process this audio file.'
          };
        } finally {
          // Always remove the uploaded file after processing
          fs.unlink(file.path, () => {});
        }
      })
    );

    // Final response: SAME format per file, wrapped in an array
    res.json({
      keyword: originalKeyword,
      results
    });
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    res.status(500).json({ error: 'Failed to process the uploaded files.' });
  }
});

module.exports = uploadRouter;

