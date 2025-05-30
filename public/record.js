document.addEventListener('DOMContentLoaded', () => {
  const recordBtn = document.getElementById('recordBtn');
  const stopBtn = document.getElementById('stopBtn');
  const detectBtn = document.getElementById('detectBtn');

  let audioChunks = [];
  let mediaRecorder = null;
  let recordedAudioBlob = null;

  recordBtn.addEventListener('click', async () => {
    try {
      audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        detectBtn.disabled = false;
      };

      mediaRecorder.start();

      recordBtn.disabled = true;
      stopBtn.disabled = false;
      detectBtn.disabled = true;
    } catch (err) {
      alert(`Error starting recording: ${err.message}`);
    }
  });

  stopBtn.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      recordBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  detectBtn.addEventListener('click', async () => {
    const keyword = document.getElementById('recordKeyword')?.value?.trim();

    if (!recordedAudioBlob) return alert('No audio recorded');
    if (!keyword) return alert('Please enter a keyword');

    const resultEl = document.getElementById('result');
    resultEl.innerHTML = `<p><em>Waiting for result...</em></p>`; // ✅ Loading message

    const formData = new FormData();
    formData.append('audioFile', recordedAudioBlob, 'recording.webm');
    formData.append('keyword', keyword);

    try {
      const res = await fetch('/record', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        resultEl.innerHTML = `<p style="color: red;">Error: ${data.error || 'Detection failed'}</p>`;
        return;
      }

      displayResult({ ...data, keyword });
    } catch (err) {
      console.error('Detection failed:', err);
      resultEl.innerHTML = `<p style="color: red;">Something went wrong during keyword detection.</p>`;
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
