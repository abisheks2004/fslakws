# 🧠 FSLAKWS (Few-Shot Language-Agnostic Keyword Spotting)

**FSLAKWS** is a smart, multilingual keyword detection system built with Node.js that uses few-shot learning to detect keywords in audio — even across different languages — using semantic similarity and transcription.

🚀 **Live Demo**: [https://fslakws.onrender.com/login](https://fslakws.onrender.com/login)

---

## 🔍 Key Features

- 🎙 **Audio Upload & Recording**: Upload pre-recorded audio or record in real-time
- 🌐 **Language-Agnostic Detection**: Works across multiple languages using translation & semantic matching
- 🔐 **Google OAuth2 Authentication**: Secure user access
- 💡 **Fast & Lightweight**: Optimized for speed, scalability, and low resource usage

---

## 🛠 Technologies Used

| Layer        | Tools/Tech                                         |
|--------------|----------------------------------------------------|
| **Frontend** | HTML5 Audio API, CSS                        |
| **Backend**  | Node.js, Express.js                                |
| **Audio**    | Multer (file uploads), fluent-ffmpeg               |
| **AI/ML**    | Hugging Face APIs (Whisper, Sentence Transformers) |
| **Auth**     | Google OAuth2                                      |
| **Deploy**   | Render.com                                         |

---

## 🧪 How It Works

1. **User Uploads or Records Audio**
2. **Speech-to-Text Transcription** using Whisper (Hugging Face)
3. **Keyword Translation** to multiple languages
4. **Semantic Embedding & Matching** between transcription and keywords
5. **Output**: Keyword presence & context with highlighting

---

- 🔐 Login Page  
- 🏠 Dashboard with Upload/Record Options  
- 📊 Results Display with Highlighted Keyword  

---


