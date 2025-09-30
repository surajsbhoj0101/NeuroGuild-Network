import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), 
    tailwindcss({
      // Pass your theme configuration directly to the plugin
      config: {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              roboto: ['Roboto', 'sans-serif'],
            }
          }
        }
      }
    })
  ],
   base: "/", 
});