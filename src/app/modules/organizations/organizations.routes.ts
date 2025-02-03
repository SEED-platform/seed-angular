import type { UrlSegment } from '@angular/router'
import type { OrganizationGenericTypeMatcher } from './organizations.types'
import {
  OrganizationsAccessLevelTreeComponent,
  OrganizationsColumnMappingsComponent,
  OrganizationsColumnSettingsComponent,
  OrganizationsCyclesComponent,
  OrganizationsDataQualityComponent,
  OrganizationsDerivedColumnsComponent,
  OrganizationsEmailTemplatesComponent,
  OrganizationsLabelsComponent,
  OrganizationsMembersComponent,
  OrganizationsSettingsComponent,
} from '.'

const genericTypeMatcher = (args: OrganizationGenericTypeMatcher) => (segments: UrlSegment[]) => {
  if (segments[0].path === args.validPage && args.validTypes.includes(segments[1]?.path)) {
    return { consumed: segments, posParams: { type: segments[1] } }
  }
}

const OrganizationsColumnMappingTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['goal', 'properties', 'taxlots'], validPage: 'column-mappings' }
  return genericTypeMatcher(args)(segments)
}

const organizationsDataQualityTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['goal', 'properties', 'taxlots'], validPage: 'data-quality' }
  return genericTypeMatcher(args)(segments)
}

const organizationsColumnSettingsTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['properties', 'taxlots'], validPage: 'column-settings' }
  return genericTypeMatcher(args)(segments)
}

const organizationsDerivedColumnsTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['properties', 'taxlots'], validPage: 'derived-columns' }
  return genericTypeMatcher(args)(segments)
}

export default [
  { path: 'settings', component: OrganizationsSettingsComponent },
  { path: 'access-level-tree', component: OrganizationsAccessLevelTreeComponent },
  { matcher: OrganizationsColumnMappingTypeMatcher, component: OrganizationsColumnMappingsComponent },
  { matcher: organizationsColumnSettingsTypeMatcher, component: OrganizationsColumnSettingsComponent },
  { matcher: organizationsDataQualityTypeMatcher, component: OrganizationsDataQualityComponent },
  { matcher: organizationsDerivedColumnsTypeMatcher, component: OrganizationsDerivedColumnsComponent },
  { path: 'cycles', component: OrganizationsCyclesComponent },
  { path: 'email-templates', component: OrganizationsEmailTemplatesComponent },
  { path: 'labels', component: OrganizationsLabelsComponent },
  { path: 'members', component: OrganizationsMembersComponent },
]
