import type { UserRole } from '@seed/api/user'
import type { Column } from '../column'

type OrgCycle = {
  name: string;
  cycle_id: number;
  num_properties: number;
  num_taxlots: number;
}

type OrgUser = {
  first_name: string;
  last_name: string;
  email: string;
  id: number;
}

export type BriefOrganization = {
  name: string;
  org_id: number;
  parent_id: number | null;
  is_parent: boolean;
  id: number;
  user_role: UserRole;
  display_decimal_places: number;
  salesforce_enabled: boolean;
  access_level_names: string[];
  audit_template_conditional_import: boolean;
  property_display_field: string;
  taxlot_display_field: string;
}

export type Organization = BriefOrganization & {
  number_of_users: number;
  user_is_owner: boolean;
  owners: OrgUser[];
  sub_orgs: (Organization & { is_parent: false })[];
  parent_id: number;
  display_units_eui: string;
  display_units_ghg: string;
  display_units_ghg_intensity: string;
  display_units_water_use: string;
  display_units_wui: string;
  display_units_area: string;
  cycles: OrgCycle[];
  created: string;
  mapquest_api_key: string;
  geocoding_enabled: boolean;
  better_analysis_api_key: string;
  better_host_url: string;
  display_meter_units: Record<string, string>;
  display_meter_water_units: Record<string, string>;
  thermal_conversion_assumption: number;
  comstock_enabled: boolean;
  new_user_email_from: string;
  new_user_email_subject: string;
  new_user_email_content: string;
  new_user_email_signature: string;
  at_organization_token: string;
  at_host_url: string;
  audit_template_user: string;
  audit_template_password: string;
  audit_template_city_id: number | null;
  audit_template_report_type: string;
  audit_template_status_types: string;
  audit_template_sync_enabled: boolean;
  ubid_threshold: number;
  inventory_count: number;
  public_feed_enabled: boolean;
  public_feed_labels: boolean;
  public_geojson_enabled: boolean;
  default_reports_x_axis_options: Column[];
  default_reports_y_axis_options: Column[];
  require_2fa: boolean;
}
export type OrganizationResponse = {
  status: string;
  organization: Organization;
}
export type OrganizationsResponse = {
  organizations: (BriefOrganization | Organization)[];
}
