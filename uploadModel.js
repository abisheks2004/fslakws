require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const langdetect = require('langdetect');

const WHISPER_API_URL = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MYMEMORY_TRANSLATE_URL = 'https://api.mymemory.translated.net/get';

let hasWarnedInvalidLang = false; // Warn only once per run


const TARGET_LANGUAGES = [
  'es', 'fr', 'ta', 'de', 'it', //  Spanish, French, Tamil, German, Italian
  'pt', 'ru', 'zh', 'ar', 'ja',  // Portuguese, Russian, Chinese, Arabic, Japanese
  'ko', 'hi', 'bn', 'mr', 'pl',  // Korean, Hindi, Bengali, Marathi, Polish
  'tr', 'nl', 'sv', 'fi', 'cs',  // Turkish, Dutch, Swedish, Finnish, Czech
  'no', 'da', 'ro', 'el', 'he'   // Norwegian, Danish, Romanian, Greek, Hebrew
];

/**
 * Translate a keyword to a specific target language using MyMemory API
 */
const translateKeyword = async (keyword, targetLang) => {
  try {
    if (!keyword || !targetLang) return keyword?.toLowerCase() || '';

    // Detect the source language of the keyword
    const detectedLang = langdetect.detectOne(keyword)?.toLowerCase() || 'en';
    if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(detectedLang)) {
      console.warn(`⚠️ Invalid source language "${detectedLang}". Falling back to 'en'.`);
      return keyword.toLowerCase(); // fallback to original if language detection fails
    }

    const response = await axios.get(MYMEMORY_TRANSLATE_URL, {
      params: {
        q: keyword,
        langpair: `${detectedLang}|${targetLang}`,
      },
    });

    const translated = response.data?.responseData?.translatedText;
    return translated?.toLowerCase() || keyword.toLowerCase();
  } catch (err) {
    console.error(`❌ Translation failed [${targetLang}]:`, err.message);
    return keyword.toLowerCase(); // fallback
  }
};

/**
 * Generate all translated keyword variants including the original one
 */
const generateKeywordVariants = async (keyword) => {
  const lowerKeyword = keyword.toLowerCase();
  const translations = await Promise.all(
    TARGET_LANGUAGES.map((lang) => translateKeyword(lowerKeyword, lang))
  );

  const uniqueKeywords = Array.from(new Set([lowerKeyword, ...translations]));
  return uniqueKeywords;
};

/**
 * Transcribe audio using Whisper API
 */
const transcribeUsingWhisperAPI = async (audioPath) => {
  try {
    const audioData = fs.readFileSync(audioPath);

    const response = await axios.post(WHISPER_API_URL, audioData, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'audio/wav',
      },
    });

    if (typeof response.data === 'string' && response.data.includes('loading')) {
      throw new Error('Model is currently loading on Hugging Face. Try again later.');
    }

    if (response.data?.error) {
      throw new Error(response.data.error);
    }

    const text = response.data.text?.toLowerCase().trim() || '';
    if (!text) {
      throw new Error('Empty transcription result');
    }

    return text;
  } catch (error) {
    console.error('❌ Error during transcription:', error.response?.data || error.message);
    throw new Error('Transcription failed.');
  }
};

/**
 * Match translated keywords in the transcribed audio
 */
const matchKeywordInTranscription = async (audioPath, originalKeyword) => {
  const transcription = await transcribeUsingWhisperAPI(audioPath);
  const keywordVariants = await generateKeywordVariants(originalKeyword);

  console.log('📝 Transcription:', transcription);
  console.log('🔍 Checking for keywords:', keywordVariants);

  const matchedKeyword = keywordVariants.find((kw) => transcription.includes(kw));
  const result = !!matchedKeyword;

  if (result) {
    console.log(`✅ Keyword "${matchedKeyword}" FOUND in transcription.`);
  } else {
    console.log(`❌ No keyword match found.`);
  }

  return {
    transcription,
    result,
    matchedKeyword: matchedKeyword || null,
    searchedKeywords: keywordVariants,
  };
};

module.exports = {
  matchKeywordInTranscription,
};
