type Organization = {
  id: number;
  name: string;
  propertiesByCycle: { cycle: string; count: number }[];
  taxLotsByCycle: { cycle: string; count: number }[];
  role: 'Owner' | 'Member' | 'Viewer';
  owners: string[];
}

export type OrganizationsList = Organization[]
