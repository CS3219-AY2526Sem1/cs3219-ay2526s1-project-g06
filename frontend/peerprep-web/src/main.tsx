import { createRoot } from "react-dom/client";
import App from "./App";
import Prism from "prismjs";
(window as any).Prism = Prism; // must come before any component imports
import 'prismjs/themes/prism.css';
import "prismjs/components/prism-clike";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import 'prismjs/components/prism-python';

createRoot(document.getElementById("root")!).render(<App />);
