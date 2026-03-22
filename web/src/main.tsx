import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Importa o seu componente principal
import './index.css'; // Importa o Tailwind/CSS

// Essa é a linha que 'liga' o React ao HTML
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
