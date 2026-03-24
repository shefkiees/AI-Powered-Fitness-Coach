import dotenv from "dotenv";

// Ngarko variablat nga .env.local
dotenv.config({ path: ".env.local" });

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);