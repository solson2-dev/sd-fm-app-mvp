import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance to prevent connection pool leaks
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create a singleton Supabase client instance
 *
 * This implementation:
 * 1. Prevents multiple client instances (connection pool leaks)
 * 2. Reuses the same connection across the application
 * 3. Configures optimal settings for server-side usage
 *
 * @returns {SupabaseClient} The singleton Supabase client
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. ' +
        'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false, // Server-side: no session persistence needed
        autoRefreshToken: false, // Server-side: no auto-refresh
      },
      global: {
        headers: {
          'X-Client-Info': 'sd-fm-app-mvp/1.0',
        },
      },
    });
  }

  return supabaseClient;
}

// For backward compatibility - existing code can still use `import { supabase }`
export const supabase = getSupabaseClient();

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      scenarios: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      personnel_roles: {
        Row: {
          id: string;
          scenario_id: string;
          role_name: string;
          base_salary: number;
          start_month: number;
          end_month: number | null;
          department: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          scenario_id: string;
          role_name: string;
          base_salary: number;
          start_month: number;
          end_month?: number | null;
          department?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          scenario_id?: string;
          role_name?: string;
          base_salary?: number;
          start_month?: number;
          end_month?: number | null;
          department?: string | null;
          created_at?: string;
        };
      };
      monthly_opex_projections: {
        Row: {
          id: string;
          scenario_id: string;
          month: number;
          personnel_cost: number;
          headcount: number;
          marketing: number;
          sales: number;
          infrastructure: number;
          facilities: number;
          professional_services: number;
          other: number;
          total_opex: number;
          cumulative_opex: number | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          scenario_id: string;
          month: number;
          personnel_cost: number;
          headcount: number;
          marketing?: number;
          sales?: number;
          infrastructure?: number;
          facilities?: number;
          professional_services?: number;
          other?: number;
          total_opex: number;
          cumulative_opex?: number | null;
          calculated_at?: string;
        };
        Update: {
          id?: string;
          scenario_id?: string;
          month?: number;
          personnel_cost?: number;
          headcount?: number;
          marketing?: number;
          sales?: number;
          infrastructure?: number;
          facilities?: number;
          professional_services?: number;
          other?: number;
          total_opex?: number;
          cumulative_opex?: number | null;
          calculated_at?: string;
        };
      };
    };
  };
};
