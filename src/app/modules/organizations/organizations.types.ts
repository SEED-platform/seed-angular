export type Organization = {
  id: number;
  name: string;
  propertiesByCycle: { cycle: string; count: number }[];
  taxLotsByCycle: { cycle: string; count: number }[];
  role: string;
  owners: string[];
}

export type OrganizationsList = Organization[]
