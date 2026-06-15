import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import WebSocket from "ws";

// Load environment variables from frontend/.env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket as any,
  },
});

async function run() {
  console.log("Checking storage buckets on Supabase...");
  
  const { data: buckets, error: getBucketsError } = await supabaseAdmin.storage.listBuckets();
  
  if (getBucketsError) {
    console.error("Error listing buckets:", getBucketsError.message);
    process.exit(1);
  }
  
  const bucketName = "book-covers";
  const exists = buckets.some((b) => b.name === bucketName);
  
  if (exists) {
    console.log(`Bucket "${bucketName}" already exists.`);
  } else {
    console.log(`Creating bucket "${bucketName}"...`);
    const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/jpg"],
      fileSizeLimit: 5242880, // 5MB
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError.message);
      process.exit(1);
    }
    console.log(`Bucket "${bucketName}" successfully created.`);
  }
  
  console.log("Supabase storage bucket is ready.");
}

run().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
