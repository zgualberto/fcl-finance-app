export interface Category {
  id?: number;
  category_name: string;
  is_active: number;
  created_at?: Date;
  parent_id?: number;
  transaction_type: string;
  parent_name?: string;
  path?: string;
}
