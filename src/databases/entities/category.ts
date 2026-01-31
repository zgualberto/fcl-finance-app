export interface Category {
  id?: number;
  name: string;
  is_active?: boolean;
  created_at?: Date;
  parent_id?: number;
  is_expense: boolean;
}
