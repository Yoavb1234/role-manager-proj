
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from "@/integrations/supabase/client";

// Enable debug mode in development
if (import.meta.env.DEV) {
  console.log("Debug mode enabled");
  console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL || "Not set");
  console.log("Supabase connection test...");
  
  // Test the Supabase connection
  supabase.from('profiles').select('count').then(
    ({ data, error }) => {
      if (error) {
        console.error("Supabase connection test failed:", error);
      } else {
        console.log("Supabase connection successful:", data);
      }
    }
  );
  
  // Expose supabase for debugging in console
  (window as any).supabase = supabase;
}

createRoot(document.getElementById("root")!).render(<App />);
