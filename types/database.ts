// Placeholder for the generated Supabase types. The project schema is empty,
// so there is nothing to generate yet: `npx supabase gen types typescript
// --project-id bfrgwfuswqrwhurmryyv` requires an authenticated CLI session,
// which is not available here, so this file is hand-written to match the
// shape the CLI produces for an empty `public` schema.
//
// Regenerate this file once migrations land, with:
//   npx supabase gen types typescript --project-id bfrgwfuswqrwhurmryyv > types/database.ts
// The Supabase clients in lib/supabase are already generic over `Database`,
// so tables gain full typing with no further change to those files.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
