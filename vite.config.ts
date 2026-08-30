import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sites } from "@openai/sites-vite-plugin";

// The harness assigns the dev port through PORT; fall back to Vite's default.
export default defineConfig({
  plugins: [react(), sites()],
  build: { outDir: "dist/client" },
  server: { port: Number(process.env.PORT) || 5173 },
});
