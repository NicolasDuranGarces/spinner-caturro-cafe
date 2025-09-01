// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        allowedHosts: [
            "caturro-spinner.niduga.com", // 👈 tu dominio
        ],
        host: true, // Permitir exponer en la red
    },
});