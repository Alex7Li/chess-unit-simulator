import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import 'vite/modulepreload-polyfill'

const SUPPRESSED_WARNINGS = [
  // the canvas library always emits a warning
  'No stroke found!', 
   // From the blockly typed variable modal library
  'Blockly.utils.object.mixin was deprecated in May 2022 and will be deleted in May 2023.'
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
