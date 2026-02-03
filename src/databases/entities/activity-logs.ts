export interface ActivityLog {
  id?: number;
  log: string;
  created_at?: Date;
  parent_id?: number;
  is_error?: boolean;
}
