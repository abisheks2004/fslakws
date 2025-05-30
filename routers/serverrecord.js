const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { transcribeRecordedAudio } = require('../recordModel');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// POST /record
// Uploads a recorded audio file and returns keyword match result
router.post('/record', upload.single('audioFile'), async (req, res) => {
  const keyword = req.body.keyword?.trim();

  if (!req.file || !keyword) {
    return res.status(400).json({
      error: 'Missing audio file or keyword',
      hint: 'Make sure "audioFile" and "keyword" are included in the form-data request.'
    });
  }

  try {
    const resultData = await transcribeRecordedAudio(req.file.path, keyword);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...resultData
    });
  } catch (error) {
    console.error('❌ Record processing error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process audio file.',
      message: error.message
    });
  } finally {
    // Clean up uploaded file after processing
    fs.unlink(req.file.path, (err) => {
      if (err) console.warn('⚠️ Failed to delete uploaded file:', err.message);
    });
  }
});

module.exports = router;