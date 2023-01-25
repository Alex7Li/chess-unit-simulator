import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import axios from 'axios'
import { API_URL } from './components/definitions'

const SUPPRESSED_WARNINGS = [
  'No stroke found!' // the canvas library always emits a warning
];
const consoleWarn = console.warn;

console.warn = function filterWarnings(msg, ...args) {
    if (!SUPPRESSED_WARNINGS.some((entry) => msg.includes(entry))) {
        consoleWarn(msg, ...args);
    }
};


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
