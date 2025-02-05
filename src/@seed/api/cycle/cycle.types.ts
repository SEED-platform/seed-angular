// organization, user, and id omitted during cycle create/edit
export type Cycle = {
  name: string;
  start: string;
  end: string;
  organization?: number;
  user?: number | null;
  id?: number;
}

export type ListCyclesResponse = {
  status: string;
  cycles: Cycle[];
}

export type GetCycleResponse = {
  status: string;
  cycles: Cycle;
}
