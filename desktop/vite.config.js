import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      include: /\.(js|jsx|ts|tsx)$/,
    }),
  ],
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
});
