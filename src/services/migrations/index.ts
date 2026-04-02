/**
 * Migration index - import all migrations here
 * Migrations are loaded in order of version number
 */
import type { Migration } from './types';
import { migration as migration1 } from './1_initial_schema';
import { migration as migration2 } from './2_create_activity_log_schema';
import { migration as migration3 } from './3_remove_updatedAt_activity_log_schema';
import { migration as migration4 } from './4_create_settings_schema';
import { migration as migration5 } from './5_rename_settings_to_application_settings';
import { migration as migration6 } from './6_add_performance_indexes';
import { migration as migration7 } from './7_add_non_remittable_to_categories';
import { migration as migration8 } from './8_add_effectivity_date_to_categories';

export const migrations: Migration[] = [
  migration1,
  migration2,
  migration3,
  migration4,
  migration5,
  migration6,
  migration7,
  migration8,
];
