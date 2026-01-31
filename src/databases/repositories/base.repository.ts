export interface BaseRepository<T> {
  insert(entity: T): Promise<number>;
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  update(entity: T): Promise<void>;
  delete(id: number): Promise<void>;
}
