document.addEventListener('DOMContentLoaded', () => {
  const uploadBtn = document.getElementById('uploadBtn');

  uploadBtn.addEventListener('click', async () => {
    const file = document.getElementById('audioFile')?.files?.[0];
    const keyword = document.getElementById('uploadKeyword')?.value?.trim();

    if (!file) return alert('Please select a file to upload');
    if (!keyword) return alert('Please enter a keyword');

    const allowedTypes = ['audio/wav', 'audio/mpeg', 'audio/webm', 'audio/mp3'];
    if (!allowedTypes.includes(file.type)) {
      return alert(`Unsupported file type: ${file.type}`);
    }

    const formData = new FormData();
    formData.append('audioFile', file);
    formData.append('keyword', keyword);

    // ✅ Show loading message
    const resultEl = document.getElementById('result');
    resultEl.innerHTML = `<p><em>Waiting for result...</em></p>`;

    try {
      const res = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        resultEl.innerHTML = `<p style="color: red;">Error: ${data.error || 'Upload failed'}</p>`;
        return;
      }

      displayResult({ ...data, keyword });
    } catch (err) {
      console.error('Upload failed:', err);
      resultEl.innerHTML = `<p style="color: red;">Something went wrong during upload.</p>`;
    }
  });
});

function displayResult(data) {
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = `
    <p><strong>Keyword Found:</strong> ${data.result ? 'Yes ✅' : 'No ❌'}</p>
    <p><strong>Matched Keyword:</strong> ${data.matchedKeyword || '-'}</p>
    <p><strong>Transcription:</strong> ${highlightKeyword(data.transcription, data.matchedKeyword)}</p>
  `;
}

function highlightKeyword(text = '', keyword = '') {
  if (!keyword) return text;
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
  return text.replace(regex, '<span style="background: yellow;">$1</span>');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
