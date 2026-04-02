export interface Category {
  id?: number;
  category_name: string;
  is_active: number;
  created_at?: Date;
  parent_id?: number | null;
  non_remittable?: number;
  effective_date?: Date | null;
  transaction_type?: string | null;
  parent_name?: string;
  path?: string;
}
