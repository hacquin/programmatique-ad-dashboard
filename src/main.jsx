import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", flexDirection: "column", gap: 16, padding: 20, textAlign: "center",
        }}>
          <p style={{ color: "#c4a962", fontSize: 18, fontWeight: 600 }}>
            Une erreur est survenue
          </p>
          <p style={{ color: "#e8dcc8", fontSize: 14 }}>
            Essayez de recharger la page (Ctrl+Shift+R).
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: "8px 20px", borderRadius: 6,
              border: "1px solid #c4a962", background: "transparent",
              color: "#c4a962", cursor: "pointer", fontSize: 14,
            }}
          >
            Recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
