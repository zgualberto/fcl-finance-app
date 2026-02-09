export interface Transaction {
  id?: number;
  member_id?: number | null;
  category_id?: number | null;
  amount: number;
  description?: string;
  date: string;
  created_at?: Date;
  updated_at?: Date;
}
