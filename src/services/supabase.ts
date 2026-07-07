import { createClient } from "@/lib/client"

// Single configured Supabase client for the whole app.
// All services import this instance instead of creating their own.
const supabase = createClient()

export default supabase
