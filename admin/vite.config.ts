import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "/admin/",
  build: {
    outDir: "../public/admin",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules\/(firebase|@firebase)\//.test(id)) return "firebase";
          if (/node_modules\/(react-markdown|remark|remark-|unified|micromark|mdast|hast)/.test(id)) return "markdown";
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
        },
      },
    },
  },
});
