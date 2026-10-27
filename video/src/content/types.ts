export type RoleId = 'sales' | 'sales_manager' | 'site_manager' | 'engineer' | 'administrator';

export interface Shot {
  id: string;
  /** App route; `:id` is resolved at capture time from the first row of the parent list. */
  route: string;
  caption: string;
  /** Playwright locator for the element to highlight, e.g. `role=button[name="Tambah"]`. */
  highlight: string;
  zoom?: number;
}

export interface Role {
  id: RoleId;
  number: string;
  name: string;
  color: string;
  who: string;
  mainTask: string;
  flow: string[];
  shots: Shot[];
  recap: string;
  durationSec: number;
  /** Sidebar labels, from frontend/src/components/layout/Sidebar.jsx. */
  menu: string[];
}
