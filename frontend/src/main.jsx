import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#112D4E',
              color: '#F9F7F7',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #3F72AF',
            },
          }} 
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
