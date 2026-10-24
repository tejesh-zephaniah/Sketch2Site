
import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8000/api/generate";

function Icon({ name, size = 18, ...props }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };

  const paths = {
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
      </>
    ),
    code: (
      <>
        <path d="m8 8-4 4 4 4" />
        <path d="m16 8 4 4-4 4" />
        <path d="m14 4-4 16" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7" />
        <path d="m21 3-10 10" />
        <path d="M18 13v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h5" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="m19 6-1 14H6L5 6" />
        <path d="M10 10v6M14 10v6" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    alert: (
      <>
        <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5.6 9A7 7 0 0 1 18 6l2 6" />
        <path d="M18.4 15A7 7 0 0 1 6 18l-2-6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name] || paths.sparkles}</svg>;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function App() {
  const inputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [activeTab, setActiveTab] = useState("html");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const activeCode = activeTab === "html" ? html : css;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function selectFile(selectedFile) {
    if (!selectedFile) return;

    setError("");

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please choose an image file such as PNG, JPG, or WEBP.");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Supported image formats are PNG, JPG, and WEBP.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Your image is too large. Please choose an image under 10 MB.");
      return;
    }

    setFile(selectedFile);
    setHasGenerated(false);
    setHtml("");
    setCss("");

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    const nextUrl = URL.createObjectURL(selectedFile);
    setImageUrl(nextUrl);
    setActiveTab("html");
  }

  function removeFile() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setFile(null);
    setImageUrl("");
    setHtml("");
    setCss("");
    setError("");
    setHasGenerated(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  async function generateWebsite() {
    if (!file || isGenerating) return;

    setIsGenerating(true);
    setError("");
    setHasGenerated(false);
    setHtml("");
    setCss("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          response.ok
            ? "The server returned an invalid response. Please check your backend."
            : `Backend error (${response.status}). Make sure the backend is running.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Generation failed with status ${response.status}.`
        );
      }

      if (typeof data.html !== "string" || !data.html.trim()) {
        throw new Error(
          "The backend response did not contain generated HTML. Expected { html, css }."
        );
      }

      setHtml(data.html);
      setCss(typeof data.css === "string" ? data.css : "");
      setActiveTab("html");
      setHasGenerated(true);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to the backend. Check that it is running on port 8000."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyCode() {
    if (!activeCode) return;

    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy automatically. Select the code and copy it manually.");
    }
  }

  function openWebsite() {
    if (!html.trim()) {
      setError("Generate your website first, then open it here.");
      return;
    }

    const fullHtml = html.includes("<html") || html.includes("<!DOCTYPE")
      ? html
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Generated Website</title>
  <style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!newWindow) {
      URL.revokeObjectURL(url);
      setError("Your browser blocked the new tab. Allow pop-ups and try again.");
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = url;
    setError("");
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <a className="brand" href="#" onClick={(event) => event.preventDefault()}>
          <span className="brand-icon">
            <Icon name="sparkles" size={22} />
          </span>
          <span className="brand-copy">
            <span className="brand-name">
              Sketch<span>2</span>Site
            </span>
            <span className="brand-caption">AI WEBSITE GENERATOR</span>
          </span>
        </a>

        <div className="topbar-actions">
          <div className="connection-indicator">
            <span className="connection-dot" />
            GEMMA AI
          </div>

          <button
            className="button button-secondary top-button"
            onClick={openWebsite}
            disabled={!html}
            type="button"
          >
            <Icon name="external" size={15} />
            Open Website
          </button>

          <button
            className="button button-primary top-button"
            onClick={generateWebsite}
            disabled={!file || isGenerating}
            type="button"
          >
            {isGenerating ? (
              <span className="spinner" />
            ) : (
              <Icon name="code" size={15} />
            )}
            {isGenerating ? "Generating..." : "Run"}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="main-panel">
          <div className="intro">
            <div className="eyebrow">
              <Icon name="sparkles" size={14} />
              FROM SKETCH TO WEBSITE
            </div>

            <h1>
              Your drawing.
              <br />
              <span>A real website.</span>
            </h1>

            <p>
              Turn your hand-drawn designs into clean HTML and CSS. Upload a
              sketch and let AI bring your ideas to life.
            </p>
          </div>

          <section
            className={`upload-card${isDragging ? " is-dragging" : ""}${
              file ? " has-file" : ""
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => selectFile(event.target.files?.[0])}
            />

            {file ? (
              <div className="selected-file">
                <div className="image-preview">
                  <img src={imageUrl} alt="Selected sketch preview" />
                </div>

                <div className="file-details">
                  <div className="file-type">
                    <Icon name="check" size={13} />
                    IMAGE READY
                  </div>
                  <h2>{file.name}</h2>
                  <p>{formatBytes(file.size)} · Ready to convert</p>

                  <div className="file-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => inputRef.current?.click()}
                    >
                      Change image
                    </button>
                    <button
                      type="button"
                      className="text-button remove-button"
                      onClick={removeFile}
                    >
                      <Icon name="trash" size={13} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="dropzone-content"
                type="button"
                onClick={() => inputRef.current?.click()}
              >
                <span className="upload-illustration">
                  <span className="upload-orbit orbit-one" />
                  <span className="upload-orbit orbit-two" />
                  <span className="upload-icon">
                    <Icon name="upload" size={27} />
                  </span>
                </span>

                <span className="dropzone-title">
                  {isDragging ? "Drop your sketch here" : "Upload your sketch"}
                </span>
                <span className="dropzone-description">
                  Drag and drop your image, or{" "}
                  <span className="inline-link">browse files</span>
                </span>
                <span className="file-format">
                  <span>PNG</span> · <span>JPG</span> · <span>WEBP</span>
                  &nbsp; up to 10 MB
                </span>
              </button>
            )}

            <div className="upload-footer">
              <span className="secure-note">
                <Icon name="shield" size={13} />
                Your design stays yours
              </span>
              <span className="upload-footer-tag">STEP 01 / UPLOAD</span>
            </div>
          </section>

          <button
            className="button button-primary generate-button"
            type="button"
            onClick={generateWebsite}
            disabled={!file || isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner" />
                Converting your sketch...
              </>
            ) : (
              <>
                <Icon name="sparkles" size={17} />
                Generate Website
                <span className="button-arrow">→</span>
              </>
            )}
          </button>

          {error && (
            <div className="error-message" role="alert">
              <span>
                <Icon name="alert" size={16} />
              </span>
              {error}
            </div>
          )}

          <section className="status-card">
            <div className="status-heading">
              <div>
                <div className="status-kicker">WORKFLOW</div>
                <h3>Conversion progress</h3>
              </div>

              <span
                className={`status-pill ${
                  hasGenerated
                    ? "status-success"
                    : isGenerating
                      ? "status-working"
                      : ""
                }`}
              >
                <span className="status-pill-dot" />
                {hasGenerated
                  ? "COMPLETE"
                  : isGenerating
                    ? "PROCESSING"
                    : "STANDING BY"}
              </span>
            </div>

            <div className="status-stages">
              {[
                { label: "Upload sketch", done: Boolean(file) },
                { label: "AI analysis", done: hasGenerated, active: isGenerating },
                { label: "Generate code", done: hasGenerated },
                { label: "Ready to run", done: hasGenerated },
              ].map((stage, index, stages) => (
                <div className="status-stage" key={stage.label}>
                  <span
                    className={`stage-icon${
                      stage.done ? " stage-done" : ""
                    }${stage.active ? " stage-active" : ""}`}
                  >
                    {stage.done ? (
                      <Icon name="check" size={13} />
                    ) : stage.active ? (
                      <span className="mini-spinner" />
                    ) : (
                      index + 1
                    )}
                  </span>

                  <span
                    className={`stage-label${
                      stage.done ? " stage-label-done" : ""
                    }`}
                  >
                    {stage.label}
                  </span>

                  {index < stages.length - 1 && (
                    <span
                      className={`stage-line${
                        stage.done ? " stage-line-done" : ""
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            <p className="status-footnote">
              {hasGenerated
                ? "Your code is ready. Review it and open your website."
                : isGenerating
                  ? "Gemma AI is processing your sketch and generating the website code."
                  : file
                    ? "Your image is ready. Generate the website to begin."
                    : "Upload a sketch to begin your conversion."}
            </p>
          </section>

          <div className="bottom-note">
            <Icon name="sparkles" size={13} />
            Powered by Gemma AI · Sketch to code, made simple
          </div>
        </section>

        <aside className="code-panel">
          <div className="code-panel-header">
            <div>
              <div className="panel-eyebrow">
                <span className="panel-live-dot" />
                YOUR OUTPUT
              </div>
              <h2>Generated Code</h2>
              <p>Your website code will appear here.</p>
            </div>

            <span
              className={`code-ready-tag${hasGenerated ? " code-ready" : ""}`}
            >
              <span />
              {hasGenerated ? "READY" : "WAITING"}
            </span>
          </div>

          <div className="code-tabs">
            <button
              type="button"
              className={`code-tab${activeTab === "html" ? " active" : ""}`}
              onClick={() => setActiveTab("html")}
            >
              <span className="tab-dot" />
              index.html
            </button>
            <button
              type="button"
              className={`code-tab${activeTab === "css" ? " active" : ""}`}
              onClick={() => setActiveTab("css")}
            >
              <span className="tab-dot" />
              style.css
            </button>
          </div>

          <div className="code-toolbar">
            <span>
              <span className="code-language-dot" />
              {activeTab === "html" ? "HTML DOCUMENT" : "CSS STYLESHEET"}
            </span>

            <button
              type="button"
              className="copy-button"
              onClick={copyCode}
              disabled={!activeCode}
            >
              <Icon name={copied ? "check" : "copy"} size={13} />
              {copied ? "Copied!" : "Copy code"}
            </button>
          </div>

          <div className="code-content">
            {activeCode ? (
              <pre>
                <code>{activeCode}</code>
              </pre>
            ) : (
              <div className="code-empty">
                <span className="empty-code-icon">
                  <Icon name="code" size={24} />
                </span>
                <h3>Your code starts here</h3>
                <p>
                  Upload a sketch and generate your website to see the HTML and
                  CSS.
                </p>
                <div className="empty-code-hint">
                  <Icon name="sparkles" size={13} />
                  Waiting for your first generation
                </div>
              </div>
            )}
          </div>

          <div className="code-panel-footer">
            <div className="footer-file">
              <span className="footer-file-icon">
                <Icon name="file" size={17} />
              </span>
              <div>
                <strong>{activeTab === "html" ? "index.html" : "style.css"}</strong>
                <span>
                  {activeCode
                    ? `${activeCode.split("\n").length} lines of code`
                    : "No code generated yet"}
                </span>
              </div>
            </div>
            <span className="footer-language">
              {activeTab === "html" ? "HTML5" : "CSS3"}
            </span>
          </div>

          <div className="code-tip">
            <span className="tip-icon">
              <Icon name="sparkles" size={16} />
            </span>
            <div>
              <strong>Ready to see it live?</strong>
              <p>
                Generate your code, then select Open Website to view the
                result in a new browser tab.
              </p>
            </div>
          </div>
        </aside>
      </main>

      <footer className="app-footer">
        <span>
          SKETCH2SITE <span className="footer-separator">/</span> BUILT WITH AI
        </span>
        <span>
          <span className="footer-status-dot" />
          GEMMA AI INTEGRATION
        </span>
      </footer>
    </div>
  );
}
