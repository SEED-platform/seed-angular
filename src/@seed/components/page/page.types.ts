import type { InventoryType } from 'app/modules/inventory'

export type Config = {
  action?: () => void;
  actionClasses?: string;
  actionIcon?: string;
  actionText?: string;
  action2?: () => void;
  action2Classes?: string;
  action2Icon?: string;
  action2Text?: string;
  breadcrumbs?: string[];
  sideNavToggle?: boolean;
  tabs?: InventoryType[];
  title: string;
  titleIcon?: string;
}
