export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          bio: string | null
          birth_year: number | null
          created_at: string | null
          death_year: number | null
          deleted_at: string | null
          deleted_by: string | null
          display_name: string
          family_name: string | null
          given_name: string | null
          id: string
          is_isu_affiliated: boolean | null
          name_raw: string | null
          nationality: string | null
          ulan_id: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string | null
          death_year?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_name: string
          family_name?: string | null
          given_name?: string | null
          id?: string
          is_isu_affiliated?: boolean | null
          name_raw?: string | null
          nationality?: string | null
          ulan_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          birth_year?: number | null
          created_at?: string | null
          death_year?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          display_name?: string
          family_name?: string | null
          given_name?: string | null
          id?: string
          is_isu_affiliated?: boolean | null
          name_raw?: string | null
          nationality?: string | null
          ulan_id?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string | null
          building_code: string | null
          campus_area: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          primary_contact: string | null
          short_name: string | null
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          building_code?: string | null
          campus_area?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          primary_contact?: string | null
          short_name?: string | null
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          building_code?: string | null
          campus_area?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          primary_contact?: string | null
          short_name?: string | null
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      condition_reports: {
        Row: {
          assessed_by: string
          assessment_date: string
          condition_notes: string | null
          created_at: string | null
          damage_description: string | null
          deleted_at: string | null
          id: string
          next_review_date: string | null
          overall_condition: string
          treatment_notes: string | null
          treatment_recommended: boolean | null
          work_id: string
        }
        Insert: {
          assessed_by: string
          assessment_date: string
          condition_notes?: string | null
          created_at?: string | null
          damage_description?: string | null
          deleted_at?: string | null
          id?: string
          next_review_date?: string | null
          overall_condition: string
          treatment_notes?: string | null
          treatment_recommended?: boolean | null
          work_id: string
        }
        Update: {
          assessed_by?: string
          assessment_date?: string
          condition_notes?: string | null
          created_at?: string | null
          damage_description?: string | null
          deleted_at?: string | null
          id?: string
          next_review_date?: string | null
          overall_condition?: string
          treatment_notes?: string | null
          treatment_recommended?: boolean | null
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_reports_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_reports_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works_with_condition"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_assets: {
        Row: {
          asset_type: string | null
          caption: string | null
          copyright_notice: string | null
          deleted_at: string | null
          file_url: string
          filename: string | null
          id: string
          is_primary: boolean | null
          sort_order: number | null
          uploaded_at: string | null
          work_id: string
        }
        Insert: {
          asset_type?: string | null
          caption?: string | null
          copyright_notice?: string | null
          deleted_at?: string | null
          file_url: string
          filename?: string | null
          id?: string
          is_primary?: boolean | null
          sort_order?: number | null
          uploaded_at?: string | null
          work_id: string
        }
        Update: {
          asset_type?: string | null
          caption?: string | null
          copyright_notice?: string | null
          deleted_at?: string | null
          file_url?: string
          filename?: string | null
          id?: string
          is_primary?: boolean | null
          sort_order?: number | null
          uploaded_at?: string | null
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "digital_assets_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_assets_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works_with_condition"
            referencedColumns: ["id"]
          },
        ]
      }
      import_log: {
        Row: {
          errors: number | null
          id: string
          imported: number | null
          imported_at: string | null
          notes: string | null
          skipped: number | null
          source_file: string | null
          source_system: string | null
          total_rows: number | null
        }
        Insert: {
          errors?: number | null
          id?: string
          imported?: number | null
          imported_at?: string | null
          notes?: string | null
          skipped?: number | null
          source_file?: string | null
          source_system?: string | null
          total_rows?: number | null
        }
        Update: {
          errors?: number | null
          id?: string
          imported?: number | null
          imported_at?: string | null
          notes?: string | null
          skipped?: number | null
          source_file?: string | null
          source_system?: string | null
          total_rows?: number | null
        }
        Relationships: []
      }
      loans: {
        Row: {
          agreement_file_url: string | null
          borrowing_institution: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          deleted_at: string | null
          id: string
          insurance_value: number | null
          is_active: boolean | null
          loan_end: string | null
          loan_start: string | null
          loan_type: string | null
          shipping_notes: string | null
          work_id: string
        }
        Insert: {
          agreement_file_url?: string | null
          borrowing_institution?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          insurance_value?: number | null
          is_active?: boolean | null
          loan_end?: string | null
          loan_start?: string | null
          loan_type?: string | null
          shipping_notes?: string | null
          work_id: string
        }
        Update: {
          agreement_file_url?: string | null
          borrowing_institution?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          insurance_value?: number | null
          is_active?: boolean | null
          loan_end?: string | null
          loan_start?: string | null
          loan_type?: string | null
          shipping_notes?: string | null
          work_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works_with_condition"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          building: string
          building_id: string | null
          climate_controlled: boolean | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          floor: string | null
          full_location: string | null
          id: string
          location_type: string | null
          notes: string | null
          room_code: string | null
          room_name: string | null
          security_level: string | null
        }
        Insert: {
          building: string
          building_id?: string | null
          climate_controlled?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          floor?: string | null
          full_location?: string | null
          id?: string
          location_type?: string | null
          notes?: string | null
          room_code?: string | null
          room_name?: string | null
          security_level?: string | null
        }
        Update: {
          building?: string
          building_id?: string | null
          climate_controlled?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          floor?: string | null
          full_location?: string | null
          id?: string
          location_type?: string | null
          notes?: string | null
          room_code?: string | null
          room_name?: string | null
          security_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          accession_number: string | null
          artist_id: string | null
          artist_name: string | null
          artist_name_raw: string | null
          barcode: string | null
          classification: string | null
          classification_inferred: boolean | null
          created_at: string | null
          credit_line: string | null
          data_quality_score: number | null
          date_acquired: string | null
          date_certainty: string | null
          date_created: string | null
          date_year_end: number | null
          date_year_start: number | null
          deleted_at: string | null
          deleted_by: string | null
          dimensions_d: number | null
          dimensions_display: string | null
          dimensions_h: number | null
          dimensions_w: number | null
          iconclass_ids: string[] | null
          id: string
          import_flags: string[] | null
          import_status: string | null
          is_on_display: boolean | null
          location_building: string | null
          location_floor: string | null
          location_full: string | null
          location_id: string | null
          location_room: string | null
          medium: string | null
          notes: string | null
          provenance: string | null
          rights_status: string | null
          source_file: string | null
          source_files: string[] | null
          source_system: string | null
          subject_tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          accession_number?: string | null
          artist_id?: string | null
          artist_name?: string | null
          artist_name_raw?: string | null
          barcode?: string | null
          classification?: string | null
          classification_inferred?: boolean | null
          created_at?: string | null
          credit_line?: string | null
          data_quality_score?: number | null
          date_acquired?: string | null
          date_certainty?: string | null
          date_created?: string | null
          date_year_end?: number | null
          date_year_start?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          dimensions_d?: number | null
          dimensions_display?: string | null
          dimensions_h?: number | null
          dimensions_w?: number | null
          iconclass_ids?: string[] | null
          id?: string
          import_flags?: string[] | null
          import_status?: string | null
          is_on_display?: boolean | null
          location_building?: string | null
          location_floor?: string | null
          location_full?: string | null
          location_id?: string | null
          location_room?: string | null
          medium?: string | null
          notes?: string | null
          provenance?: string | null
          rights_status?: string | null
          source_file?: string | null
          source_files?: string[] | null
          source_system?: string | null
          subject_tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          accession_number?: string | null
          artist_id?: string | null
          artist_name?: string | null
          artist_name_raw?: string | null
          barcode?: string | null
          classification?: string | null
          classification_inferred?: boolean | null
          created_at?: string | null
          credit_line?: string | null
          data_quality_score?: number | null
          date_acquired?: string | null
          date_certainty?: string | null
          date_created?: string | null
          date_year_end?: number | null
          date_year_start?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          dimensions_d?: number | null
          dimensions_display?: string | null
          dimensions_h?: number | null
          dimensions_w?: number | null
          iconclass_ids?: string[] | null
          id?: string
          import_flags?: string[] | null
          import_status?: string | null
          is_on_display?: boolean | null
          location_building?: string | null
          location_floor?: string | null
          location_full?: string | null
          location_id?: string | null
          location_room?: string | null
          medium?: string | null
          notes?: string | null
          provenance?: string | null
          rights_status?: string | null
          source_file?: string | null
          source_files?: string[] | null
          source_system?: string | null
          subject_tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "works_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      collection_summary: {
        Row: {
          buildings: number | null
          classification: string | null
          needs_review: number | null
          on_display: number | null
          total_works: number | null
        }
        Relationships: []
      }
      works_by_building: {
        Row: {
          building: string | null
          ceramics: number | null
          on_display: number | null
          paintings: number | null
          photographs: number | null
          prints: number | null
          sculptures: number | null
          total_works: number | null
        }
        Relationships: []
      }
      works_with_condition: {
        Row: {
          accession_number: string | null
          artist_id: string | null
          artist_name: string | null
          artist_name_raw: string | null
          barcode: string | null
          classification: string | null
          classification_inferred: boolean | null
          created_at: string | null
          credit_line: string | null
          date_acquired: string | null
          date_created: string | null
          dimensions_d: number | null
          dimensions_display: string | null
          dimensions_h: number | null
          dimensions_w: number | null
          id: string | null
          import_flags: string[] | null
          import_status: string | null
          is_on_display: boolean | null
          last_assessed: string | null
          latest_condition: string | null
          location_building: string | null
          location_floor: string | null
          location_full: string | null
          location_id: string | null
          location_room: string | null
          medium: string | null
          notes: string | null
          provenance: string | null
          rights_status: string | null
          source_file: string | null
          source_files: string[] | null
          source_system: string | null
          subject_tags: string[] | null
          title: string | null
          treatment_needed: boolean | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "works_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      purge_deleted_records: {
        Args: { days_old?: number }
        Returns: {
          purged_count: number
          table_name: string
        }[]
      }
      restore_record: {
        Args: { record_id: string; table_name: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
