// utils.js

function displayResult(data) {
  const resultText = document.getElementById('resultText');
  const transcriptionText = document.getElementById('transcriptionText');

  // Display overall result
  resultText.innerHTML = `
    <p><strong>Keyword Found:</strong> ${data.matchedKeyword || 'Not found'}</p>
    <p><strong>Matched Variants:</strong> ${data.searchedKeywords?.join(', ') || 'None'}</p>
    <p><strong>Result:</strong> ${data.result ? '✅ Success' : '❌ Not Found'}</p>
  `;

  // Highlight matched keyword if available
  if (data.transcription) {
    if (data.matchedKeyword) {
      const keyword = data.matchedKeyword.toLowerCase();
      const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
      const highlighted = data.transcription.replace(regex, '<span style="background-color: yellow;">$1</span>');
      transcriptionText.innerHTML = highlighted;
    } else {
      transcriptionText.innerText = data.transcription;
    }
  } else {
    transcriptionText.innerText = '📝 Transcription: N/A';
  }
}

// Safe regex escape
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

window.displayResult = displayResult;
