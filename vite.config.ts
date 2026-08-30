import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The harness assigns the dev port through PORT; fall back to Vite's default.
export default defineConfig({
  plugins: [react()],
  server: { port: Number(process.env.PORT) || 5173 },
});
