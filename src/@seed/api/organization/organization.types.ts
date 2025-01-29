import type { User } from 'app/core/user/user.types'
import type { Cycle } from '../cycle/cycle.types'

export type Organization = {
  name: string;
  org_id: number;
  id: number;
  number_of_users: number;
  user_is_owner: boolean;
  user_role?: string;
  owners: User[];
  sub_orgs: Organization[];
  is_parent: boolean;
  parent_id?: number;
  display_units_eui?: string;
  display_units_ghg?: string;
  display_units_ghg_intensity?: string;
  display_units_water_use?: string;
  display_units_wui?: string;
  display_units_area?: string;
  display_decimal_places: string;
  cycles?: Cycle[];
  created?: string;
  mapquest_api_key?: string;
  geocoding_enabled?: boolean;
  better_analysis_api_key?: string;
  better_host_url?: string;
  property_display_field: string;
  taxlot_display_field: string;
  display_meter_units?: object;
  display_meter_water_units?: object;
  thermal_conversion_assumption?: number;
  comstock_enabled?: boolean;
  new_user_email_from?: string;
  new_user_email_subject?: string;
  new_user_email_content?: string;
  new_user_email_signature?: string;
  at_organization_token?: string;
  at_host_url?: string;
  audit_template_user?: User;
  audit_template_password?: string;
  audit_template_city_id?: number;
  audit_template_conditional_import: boolean;
  audit_template_report_type?: string;
  audit_template_status_types?: string;
  audit_template_sync_enabled?: boolean;
  salesforce_enabled: boolean;
  ubid_threshold?: number;
  inventory_count?: number;
  access_level_names: string[];
  public_feed_enabled?: boolean;
  public_feed_labels?: boolean;
  public_geojson_enabled?: boolean;
  default_reports_x_axis_options?: object[];
  default_reports_y_axis_options?: object[];
  require_2fa: boolean;
}
export type OrganizationsResponse = {
  organizations: Organization[];
}

export type OrganizationResponse = {
  status: string;
  organization: Organization;
}
