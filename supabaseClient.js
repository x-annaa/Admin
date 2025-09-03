// Admin/supabaseClient.js

// 引入 Supabase SDK 已经在 HTML 里通过 <script src="https://unpkg.com/@supabase/supabase-js@2"></script> 引入

// 创建一个全局 supabaseClient
const supabaseClient = supabase.createClient(
  "https://ffdrwsemmfvqlqhyjlnb.supabase.co", // 替换为你的 Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmZHJ3c2VtbWZ2cWxxaHlqbmIiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1NjMwMjU4NCwiZXhwIjoyMDcxODc4NTg0fQ.x7TQHZ2af8O_f9ye__mT6eVstlH9BiyVkNVaOnL3h74" // 替换为你的 anon key
);

// supabaseClient 现在可以在所有引入这个文件的 JS 中直接使用
