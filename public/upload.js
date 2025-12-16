document.addEventListener("DOMContentLoaded", () => {
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("audioFile");
  const keywordInput = document.getElementById("uploadKeyword");

  const resultBox = document.getElementById("uploadResultBox");
  const loadingChip = document.getElementById("uploadLoading");
  const resultEl = document.getElementById("uploadResult");
  const metaEl = document.getElementById("uploadMeta");
  const timerEl = document.getElementById("uploadTimer");

  if (!uploadBtn) return;

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
      uploadBtn.disabled = true;
    } else {
      loadingChip.classList.add("hidden");
      uploadBtn.disabled = false;
    }
  }

  function setTimerDuration(seconds) {
    if (!timerEl) return;
    timerEl.classList.remove("hidden");
    timerEl.querySelector("span").textContent = `${seconds.toFixed(2)}s`;
  }

  uploadBtn.addEventListener("click", async () => {
    const files = Array.from(fileInput?.files || []);
    const keyword = keywordInput?.value?.trim();

    if (!files.length) {
      alert("Please select at least one audio file to upload");
      return;
    }
    if (!keyword) {
      alert("Please enter a keyword");
      return;
    }

    const allowedTypes = ["audio/wav", "audio/mpeg", "audio/webm", "audio/mp3"];
    const invalid = files.find((file) => !allowedTypes.includes(file.type));

    if (invalid) {
      alert(`Unsupported file type: ${invalid.type}`);
      return;
    }

    resetResult();
    setLoading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("audioFile", file);
    });
    formData.append("keyword", keyword);

    const startTime = performance.now(); // ⏱️ start

    try {
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (resultEl) {
          resultEl.innerHTML = `<p style="color: red;">Error: ${
            data.error || "Upload failed"
          }</p>`;
        }
        if (metaEl) metaEl.textContent = "";
        if (resultBox) resultBox.classList.add("show");
        return;
      }

      if (Array.isArray(data.results)) {
        data.results.forEach((fileResult) => {
          const { fileName, error } = fileResult;

          if (error && resultEl) {
            resultEl.innerHTML += `
              <div class="result-card">
                <div class="result-card-title">File: ${fileName || "Unknown file"}</div>
                <p style="color: red;">${error}</p>
              </div>
            `;
            return;
          }

          if (typeof window.displayResult === "function") {
            window.displayResult({
              ...fileResult,
              keyword: data.keyword || keyword,
              fileName,
              _append: true,
            });
          } else if (resultEl) {
            resultEl.innerHTML += `
              <div class="result-card">
                <div class="result-card-title">File: ${fileName || "File"}</div>
                <p><strong>Keyword Found:</strong> ${
                  fileResult.result ? "Yes ✅" : "No ❌"
                }</p>
                <p><strong>Matched Keyword:</strong> ${
                  fileResult.matchedKeyword || "-"
                }</p>
                <p><strong>Transcription:</strong><br>${
                  fileResult.transcription || "N/A"
                }</p>
              </div>
            `;
          }
        });

        if (metaEl) {
          metaEl.textContent = `Processed ${data.results.length} file(s).`;
        }
        if (resultBox) {
          resultBox.classList.add("show");
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
      if (resultEl) {
        resultEl.innerHTML =
          '<p style="color: red;">Something went wrong during upload.</p>';
      }
      if (metaEl) metaEl.textContent = "";
      if (resultBox) resultBox.classList.add("show");
    } finally {
      setLoading(false);
      const elapsed = (performance.now() - startTime) / 1000;
      setTimerDuration(elapsed); // ⏱️ show total time
    }
  });
});
