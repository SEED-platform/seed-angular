import type { AccessLevelInstance } from '@seed/api/organization'

export type EditAccessLevelsData = {
  accessLevelNames: string[];
  organizationId: number;
}

export type RenameInstanceData = {
  accessLevelNames: string[];
  accessLevelTree: AccessLevelInstance[];
  instance: AccessLevelInstance;
  organizationId: number;
}
