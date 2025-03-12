import type { AccessLevelInstance } from '@seed/api/organization'

export type RenameInstanceData = {
  accessLevelNames: string[];
  accessLevelTree: AccessLevelInstance[];
  instance: AccessLevelInstance;
  organizationId: number;
}
