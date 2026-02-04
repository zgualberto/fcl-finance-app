export interface Category {
  id?: number;
  category_name: string;
  is_active: number;
  created_at?: Date;
  parent_id?: number;
  is_expense: number;
  parent_name?: string;
  path?: string;
}
