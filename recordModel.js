require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const langdetect = require('langdetect');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MYMEMORY_TRANSLATE_URL = 'https://api.mymemory.translated.net/get';

if (!HUGGINGFACE_API_KEY) {
  throw new Error('❌ HUGGINGFACE_API_KEY is missing. Please set it in the .env file.');
}

const TARGET_LANGUAGES = [
  'es', 'fr', 'ta', 'de', 'it', // Spanish, French, Tamil, German, Italian
  'pt', 'ru', 'zh', 'ar', 'ja',  // Portuguese, Russian, Chinese, Arabic, Japanese
  'ko', 'hi', 'bn', 'mr', 'pl',  // Korean, Hindi, Bengali, Marathi, Polish
  'tr', 'nl', 'sv', 'fi', 'cs',  // Turkish, Dutch, Swedish, Finnish, Czech
  'no', 'da', 'ro', 'el', 'he'   // Norwegian, Danish, Romanian, Greek, Hebrew
];

// 🌍 Translate keyword using MyMemory
const translateKeyword = async (keyword, targetLang) => {
  try {
    targetLang = targetLang.toLowerCase();
    const detectedLang = langdetect.detectOne(keyword)?.toLowerCase() || 'en';

    if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(detectedLang)) {
      console.warn(`⚠️ Invalid source language "${detectedLang}". Falling back to 'en'.`);
      return keyword.toLowerCase();
    }

    if (detectedLang === targetLang) {
      return keyword.toLowerCase();
    }

    const res = await axios.get(MYMEMORY_TRANSLATE_URL, {
      params: {
        q: keyword,
        langpair: `${detectedLang}|${targetLang}`,
      },
    });

    return res.data?.responseData?.translatedText?.toLowerCase() || keyword.toLowerCase();
  } catch (err) {
    console.error(`❌ Translation failed [${targetLang}]:`, err.message);
    return keyword.toLowerCase();
  }
};

// 🧠 Transcribe and detect keyword
const transcribeRecordedAudio = async (filePath, originalKeyword) => {
  try {
    if (!fs.existsSync(filePath)) throw new Error(`❌ File not found: ${filePath}`);

    const audioBuffer = fs.readFileSync(filePath);
    let contentType = 'audio/webm';
    if (filePath.endsWith('.wav')) contentType = 'audio/wav';
    else if (filePath.endsWith('.mp3')) contentType = 'audio/mpeg';

    console.log(`📁 Using content type: ${contentType}`);
    console.log(`📤 Sending audio to Hugging Face Whisper...`);

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
      audioBuffer, // ✅ RAW AUDIO BUFFER
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': contentType,
          'Accept': 'application/json',
        },
        maxContentLength: 50 * 1024 * 1024,
        timeout: 120000,
      }
    );

    const transcription = response.data?.text?.toLowerCase().trim() || '';
    if (!transcription) throw new Error('⚠️ Empty transcription received.');

    console.log(`✅ Transcription:\n📝 ${transcription}`);

    const translations = await Promise.all(
      TARGET_LANGUAGES.map((lang) => translateKeyword(originalKeyword, lang))
    );

    const allVariants = Array.from(new Set([
      originalKeyword.toLowerCase(),
      ...translations.filter(Boolean),
    ]));

    console.log(`🔍 Checking for keywords:`, allVariants);

    const matchedKeyword = allVariants.find((kw) => transcription.includes(kw));
    const result = !!matchedKeyword;

    if (result) {
      console.log(`✅ Keyword "${matchedKeyword}" FOUND in transcription.`);
    } else {
      console.log(`❌ Keyword NOT found.`);
    }

    return {
      transcription,
      result,
      matchedKeyword: matchedKeyword || null,
      searchedKeywords: allVariants,
    };
  } catch (error) {
    console.error(`❌ Transcription error:`, error.response?.data || error.message);
    throw new Error('Transcription or keyword detection failed.');
  }
};

module.exports = { transcribeRecordedAudio };
