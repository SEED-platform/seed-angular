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
  compactHeader?: boolean;
  dense?: boolean; // compact header (the default); set false for the roomier legacy header
  subTitle?: string;
  switchLink?: boolean; // shows a 'switch to <other type>' link beside the title instead of the tab strip
  sideNavToggle?: boolean;
  tabs?: InventoryType[];
  title: string;
  titleIcon?: string;
}
