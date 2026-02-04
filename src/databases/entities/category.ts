export interface Category {
  id?: number;
  category_name: string;
  is_active?: boolean;
  created_at?: Date;
  parent_id?: number;
  is_expense: boolean;
  parent_name?: string;
}
