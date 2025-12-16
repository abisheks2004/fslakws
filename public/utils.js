// utils.js

function displayResult(data) {
  // New upload page elements
  const uploadResultEl = document.getElementById("uploadResult");
  const uploadMetaEl = document.getElementById("uploadMeta");
  const uploadBox = document.getElementById("uploadResultBox");

  // Legacy / fallback elements
  const resultText = document.getElementById("resultText");
  const transcriptionText = document.getElementById("transcriptionText");
  const genericResult = document.getElementById("result");

  const {
    matchedKeyword,
    searchedKeywords,
    transcription,
    result,
    language,
    confidence,
    fileName,
    _append,
  } = data || {};

  // Remove junk/unwanted phrases from variants
  const unwanted = [
    "please select two distinct languages",
    "please select two different languages",
    "select two distinct languages",
    "select two different languages",
  ];

  const variantsList = (searchedKeywords || []).filter((kw) => {
    if (!kw) return false;
    const lower = kw.toLowerCase().trim();
    return !unwanted.includes(lower);
  });

  const variantsText = variantsList.length ? variantsList.join(", ") : "None";

  const effectiveKeyword = matchedKeyword || "";
  const transcriptText = transcription || "Transcription not available.";
  const highlightedTranscript = highlightKeyword(transcriptText, effectiveKeyword);
  const foundLabel = result ? "✅ Success" : "❌ Not Found";

  // ======================
  // 1️⃣ New UPLOAD UI path (supports multi-file)
  // ======================
  if (uploadResultEl) {
    // If not append mode, clear previous results
    if (!_append) {
      uploadResultEl.innerHTML = "";
      if (uploadMetaEl) uploadMetaEl.textContent = "";
    }

    const fileLabel = fileName ? `File: ${fileName}` : "File";

    const cardHtml = `
      <div class="result-card">
        <div class="result-card-title">${fileLabel}</div>
        <p><strong>Keyword Found:</strong> ${foundLabel}</p>
        <p><strong>Matched Keyword:</strong> ${
          effectiveKeyword
            ? `<span class="keyword-hit">${effectiveKeyword}</span>`
            : "Not found"
        }</p>
        <p><strong>Matched Variants:</strong> ${variantsText}</p>
        <p><strong>Transcription:</strong><br>${highlightedTranscript}</p>
      </div>
    `;

    uploadResultEl.innerHTML += cardHtml;

    if (uploadBox) {
      uploadBox.classList.add("show");
    }

    // Meta line optional – here we just keep whatever upload.js sets
    return;
  }

  // ======================================
  // 2️⃣ Legacy layout: resultText + transcript
  // ======================================
  if (resultText && transcriptionText) {
    resultText.innerHTML = `
      <p><strong>Keyword Found:</strong> ${
        effectiveKeyword || "Not found"
      }</p>
      <p><strong>Matched Variants:</strong> ${variantsText}</p>
      <p><strong>Result:</strong> ${foundLabel}</p>
    `;

    transcriptionText.innerHTML = transcription
      ? highlightedTranscript
      : "📝 Transcription: N/A";

    return;
  }

  // ================================
  // 3️⃣ Generic fallback: single #result
  // ================================
  if (genericResult) {
    genericResult.innerHTML = `
      <p><strong>Keyword Found:</strong> ${foundLabel}</p>
      <p><strong>Matched Keyword:</strong> ${
        effectiveKeyword
          ? `<span class="keyword-hit">${effectiveKeyword}</span>`
          : "Not found"
      }</p>
      <p><strong>Matched Variants:</strong> ${variantsText}</p>
      <p><strong>Transcription:</strong><br>${highlightedTranscript}</p>
    `;
  }
}

// Highlight using the CSS class .keyword-hit
function highlightKeyword(text = "", keyword = "") {
  if (!keyword) return text;
  const safeKeyword = escapeRegExp(keyword);
  const regex = new RegExp(`(${safeKeyword})`, "gi");
  return text.replace(regex, '<span class="keyword-hit">$1</span>');
}

// Safe regex escape
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

window.displayResult = displayResult;
