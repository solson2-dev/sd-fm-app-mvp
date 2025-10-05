import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
