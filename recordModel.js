require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const langdetect = require('langdetect');

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MYMEMORY_TRANSLATE_URL = 'https://api.mymemory.translated.net/get';

if (!HUGGINGFACE_API_KEY) {
  throw new Error('❌ HUGGINGFACE_API_KEY is missing. Add it to your .env file.');
}

const TARGET_LANGUAGES = [
  'es', 'fr', 'ta', 'de', 'it', // Spanish, French, Tamil, German, Italian
  'pt', 'ru', 'zh', 'ar', 'ja', // Portuguese, Russian, Chinese, Arabic, Japanese
  'ko', 'hi', 'bn', 'mr', 'pl', // Korean, Hindi, Bengali, Marathi, Polish
  'tr', 'nl', 'sv', 'fi', 'cs', // Turkish, Dutch, Swedish, Finnish, Czech
  'no', 'da', 'ro', 'el', 'he'  // Norwegian, Danish, Romanian, Greek, Hebrew
];

/**
 * Translate a keyword to the target language
 */
const translateKeyword = async (keyword, targetLang) => {
  try {
    targetLang = targetLang.toLowerCase();
    const detectedLang = langdetect.detectOne(keyword)?.toLowerCase() || 'en';

    if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(detectedLang)) {
      console.warn(`⚠️ Invalid detected language "${detectedLang}". Using English.`);
      return keyword.toLowerCase();
    }

    if (detectedLang === targetLang) return keyword.toLowerCase();

    const response = await axios.get(MYMEMORY_TRANSLATE_URL, {
      params: { q: keyword, langpair: `${detectedLang}|${targetLang}` },
    });

    return response.data?.responseData?.translatedText?.toLowerCase() || keyword.toLowerCase();
  } catch (err) {
    console.error(`❌ Translation failed [${targetLang}]:`, err.message);
    return keyword.toLowerCase();
  }
};

/**
 * MAIN FUNCTION: Transcribe & Detect Keyword
 */
const transcribeRecordedAudio = async (filePath, originalKeyword) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ File not found: ${filePath}`);
    }

    const audioBuffer = fs.readFileSync(filePath);

    let contentType = 'audio/webm';
    if (filePath.endsWith('.wav')) contentType = 'audio/wav';
    else if (filePath.endsWith('.mp3')) contentType = 'audio/mpeg';

    console.log(`📁 Detected audio type: ${contentType}`);
    console.log(`📤 Sending audio to HuggingFace Whisper...`);

    // ⭐ UPDATED NEW HUGGINGFACE WHISPER ENDPOINT ⭐
    const HF_WHISPER_URL =
      'https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3';

    const response = await axios.post(HF_WHISPER_URL, audioBuffer, {
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': contentType,
        Accept: 'application/json',
      },
      maxContentLength: 50 * 1024 * 1024,
      timeout: 120000,
    });

    const transcription = response.data?.text?.toLowerCase().trim() || '';

    if (!transcription) throw new Error('⚠️ Empty transcription received from Whisper.');

    console.log(`\n✅ Transcription Received:\n📝 ${transcription}\n`);

    // Generate keyword translations
    const translations = await Promise.all(
      TARGET_LANGUAGES.map((lang) => translateKeyword(originalKeyword, lang))
    );

    const keywordVariants = Array.from(
      new Set([
        originalKeyword.toLowerCase(),
        ...translations.filter(Boolean),
      ])
    );

    console.log(`🔍 Checking for keywords:`, keywordVariants);

    const matchedKeyword = keywordVariants.find((kw) =>
      transcription.includes(kw)
    );

    const result = !!matchedKeyword;

    if (result) {
      console.log(`\n✅ MATCH FOUND → "${matchedKeyword}"`);
    } else {
      console.log(`\n❌ No keyword match found.`);
    }

    return {
      transcription,
      result,
      matchedKeyword: matchedKeyword || null,
      searchedKeywords: keywordVariants,
    };
  } catch (error) {
    console.error(`❌ Transcription error:`, error.response?.data || error.message);
    throw new Error('Transcription or keyword detection failed.');
  }
};

module.exports = { transcribeRecordedAudio };
