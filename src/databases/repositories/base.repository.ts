export interface BaseRepository<T> {
  insert(entity: T): Promise<number>;
  findAll(): Promise<T[]>;
  findById?(id: number): Promise<T | null>;
  update?(entity: T): void;
  delete?(id: number): void;
}
