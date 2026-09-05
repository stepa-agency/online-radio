import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  // The listener page's character (src/vendor/bloub) is a vendored Vue SFC,
  // compiled to a native custom element so it can drop into the rest of the
  // React app as a plain <bloub-bot> tag.
  plugins: [react(), vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
});
