// Single API client for the whole app. Modules MUST import from here,
// never directly from "@/integrations/supabase/client", so we can swap
// transports during the Laravel migration without touching every module.
export { supabase as apiClient } from "@/integrations/supabase/client";
export { supabase } from "@/integrations/supabase/client";
