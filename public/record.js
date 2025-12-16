document.addEventListener("DOMContentLoaded", () => {
  const recordBtn = document.getElementById("recordBtn");
  const stopBtn = document.getElementById("stopBtn");
  const detectBtn = document.getElementById("detectBtn");
  const keywordInput = document.getElementById("recordKeyword");

  const resultBox = document.getElementById("recordResultBox");
  const resultEl = document.getElementById("recordResult");
  const metaEl = document.getElementById("recordMeta");
  const loadingChip = document.getElementById("recordLoading");
  const timerEl = document.getElementById("recordTimer");

  let audioChunks = [];
  let mediaRecorder = null;
  let recordedAudioBlob = null;
  let detectStartTime = null;

  function resetResult() {
    if (resultEl) resultEl.innerHTML = "";
    if (metaEl) metaEl.textContent = "";
    if (resultBox) resultBox.classList.remove("show");
    if (timerEl) {
      timerEl.classList.add("hidden");
      timerEl.querySelector("span").textContent = "0.00s";
    }
  }

  function setLoading(isLoading) {
    if (!loadingChip) return;
    if (isLoading) {
      loadingChip.classList.remove("hidden");
      detectBtn.disabled = true;
    } else {
      loadingChip.classList.add("hidden");
      detectBtn.disabled = false;
    }
  }

  function setTimerDuration(seconds) {
    if (!timerEl) return;
    timerEl.classList.remove("hidden");
    timerEl.querySelector("span").textContent = `${seconds.toFixed(2)}s`;
  }

  // 1️⃣ Start Recording
  recordBtn.addEventListener("click", async () => {
    try {
      audioChunks = [];
      resetResult();
      setLoading(false);
      recordedAudioBlob = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        recordedAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
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

  // 2️⃣ Stop Recording
  stopBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      recordBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  // 3️⃣ Detect Keyword
  detectBtn.addEventListener("click", async () => {
    const keyword = keywordInput?.value?.trim();

    if (!recordedAudioBlob) {
      alert("No audio recorded");
      return;
    }
    if (!keyword) {
      alert("Please enter a keyword");
      return;
    }

    resetResult();
    setLoading(true);
    detectStartTime = performance.now(); // ⏱️ start

    const formData = new FormData();
    formData.append("audioFile", recordedAudioBlob, "recording.webm");
    formData.append("keyword", keyword);

    try {
      const res = await fetch("/record", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        if (resultEl) {
          resultEl.innerHTML = `<p style="color: red;">Error: ${
            data.error || "Detection failed"
          }</p>`;
        }
        if (metaEl) metaEl.textContent = "";
        if (resultBox) resultBox.classList.add("show");
        return;
      }

      displayResult({ ...data, keyword });
    } catch (err) {
      console.error("Detection failed:", err);
      if (resultEl) {
        resultEl.innerHTML =
          '<p style="color: red;">Something went wrong during keyword detection.</p>';
      }
      if (metaEl) metaEl.textContent = "";
      if (resultBox) resultBox.classList.add("show");
    } finally {
      setLoading(false);
      if (detectStartTime !== null) {
        const elapsed = (performance.now() - detectStartTime) / 1000;
        setTimerDuration(elapsed); // ⏱️ show time
        detectStartTime = null;
      }
    }
  });

  // 4️⃣ Display Result with Highlight
  function displayResult(data) {
    if (!resultEl || !resultBox) return;

    const {
      result,
      matchedKeyword,
      transcription,
      language,
      confidence,
      keyword,
    } = data;

    const found = !!result;
    const effectiveKeyword = matchedKeyword || keyword || "";
    const transcriptText = transcription || "No transcription returned.";

    const highlightedTranscript = highlightKeyword(
      transcriptText,
      effectiveKeyword
    );

    resultEl.innerHTML = `
      <p><strong>Keyword Found:</strong> ${
        found ? "Yes ✅" : "No ❌"
      }</p>
      <p><strong>Matched Keyword:</strong> ${
        effectiveKeyword
          ? `<span class="keyword-hit">${effectiveKeyword}</span>`
          : "-"
      }</p>
      <p><strong>Transcription:</strong><br>${highlightedTranscript}</p>
    `;

    const parts = [];
    if (language) parts.push(`Language: ${language}`);
    if (confidence !== undefined && confidence !== null) {
      const conf =
        typeof confidence === "number"
          ? confidence.toFixed(2)
          : String(confidence);
      parts.push(`Confidence: ${conf}`);
    }
    if (metaEl) metaEl.textContent = parts.join(" • ");

    resultBox.classList.add("show");
  }

  function highlightKeyword(text = "", keyword = "") {
    if (!keyword) return text;
    const safeKeyword = escapeRegExp(keyword);
    const regex = new RegExp(`(${safeKeyword})`, "gi");
    return text.replace(regex, '<span class="keyword-hit">$1</span>');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
});
