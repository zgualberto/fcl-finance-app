/**
 * Migration index - import all migrations here
 * Migrations are loaded in order of version number
 */
import type { Migration } from './types';
import { migration as migration1 } from './1_initial_schema';
import { migration as migration2 } from './2_create_activity_log_schema';

export const migrations: Migration[] = [migration1, migration2];
