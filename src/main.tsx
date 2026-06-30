import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully catch and suppress benign WebSocket/HMR errors in the sandboxed dev environment
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || "");
    if (
      reasonMsg.includes("WebSocket") ||
      reasonMsg.includes("websocket") ||
      reasonMsg.includes("WebSocket closed") ||
      reasonMsg.includes("without opened")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener("error", (event) => {
    const errorMsg = event.message || "";
    if (
      errorMsg.includes("WebSocket") ||
      errorMsg.includes("websocket") ||
      errorMsg.includes("WebSocket closed") ||
      errorMsg.includes("without opened")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

