export interface Transaction {
  id?: number;
  member_id?: number | null;
  category_id?: number | null;
  amount: number;
  description?: string;
  date: string;
  created_at?: Date;
  updated_at?: Date;
  // Joined fields from queries
  category_name?: string;
  transaction_type?: string;
  member_name?: string;
  parent_id?: number | null;
  parent_name?: string;
}
