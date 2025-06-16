export type Ubid = {
  id: number;
  ubid: string;
  preferred: boolean;
  property: number;
  taxlot: number;
}

export type UbidResponse = {
  data: Ubid[];
  status: string;
}

export type UbidDetails = {
  ubid: string;
  preferred: boolean;
  property?: number;
  taxlot?: number;
}

export type ValidateUbidResponse = {
  status: string;
  data: {
    valid: boolean;
    ubid: string;
  };
}
