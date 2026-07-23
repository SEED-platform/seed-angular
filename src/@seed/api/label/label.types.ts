export type Label = {
  id: number;
  name: string;
  color: LabelColor;
  organization_id: number;
  show_in_list: boolean;
  is_applied?: number[];
}

export type LabelColor = 'red' | 'orange' | 'white' | 'blue' | 'light blue' | 'green' | 'gray'

export type LabelOperator = 'and' | 'or' | 'exclude'
