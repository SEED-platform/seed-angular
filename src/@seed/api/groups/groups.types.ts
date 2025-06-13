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
  systems: GroupSystem[];
  views_list: number[];
}

export type GroupSystem = {
  cooling_capacity: number | null;
  count: number;
  des_type: string;
  group_id: number;
  heating_capacity: number | null;
  id: number;
  mode: string;
  name: string;
  services: GroupService[];
  type: string;
}

export type GroupService = {
  emission_factor: number;
  id: number;
  name: string;
  properties: number[];
}
