import type { InventoryDisplayType } from 'app/modules/inventory'

export type InventoryGroupsResponse = {
  status: string;
  data: InventoryGroup[];
}

export type InventoryGroupResponse = {
  status: string;
  data: InventoryGroup;
}

export type InventoryGroup = {
  access_level_instance: number;
  access_level_instance_data: Record<string, unknown>;
  id: number;
  inventory_list: number[];
  inventory_type: InventoryDisplayType;
  name: string;
  organization: number;
  systems: Record<string, unknown>[];
  views_list: number[];
}
