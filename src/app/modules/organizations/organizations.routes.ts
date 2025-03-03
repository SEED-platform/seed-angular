import type { UrlSegment } from '@angular/router'
import type { OrganizationGenericTypeMatcher } from './organizations.types'
import {
  AccessLevelTreeComponent,
  ColumnMappingsComponent,
  ColumnSettingsComponent,
  CyclesComponent,
  DataQualityComponent,
  DerivedColumnsComponent,
  EmailTemplatesComponent,
  LabelsComponent,
  MembersComponent,
  SettingsComponent,
} from '.'

const genericTypeMatcher = (args: OrganizationGenericTypeMatcher) => (segments: UrlSegment[]) => {
  if (segments[0].path === args.validPage && args.validTypes.includes(segments[1]?.path)) {
    return { consumed: segments, posParams: { type: segments[1] } }
  }
}

const columnMappingTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['goal', 'properties', 'taxlots'], validPage: 'column-mappings' }
  return genericTypeMatcher(args)(segments)
}

const dataQualityTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['goal', 'properties', 'taxlots'], validPage: 'data-quality' }
  return genericTypeMatcher(args)(segments)
}

const columnSettingsTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['properties', 'taxlots'], validPage: 'column-settings' }
  return genericTypeMatcher(args)(segments)
}

const derivedColumnsTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['properties', 'taxlots'], validPage: 'derived-columns' }
  return genericTypeMatcher(args)(segments)
}

export default [
  { path: 'settings', component: SettingsComponent, loadChildren: () => import('app/modules/organizations/settings/settings.routes') },
  { path: 'access-level-tree', component: AccessLevelTreeComponent },
  { matcher: columnMappingTypeMatcher, component: ColumnMappingsComponent },
  { matcher: columnSettingsTypeMatcher, component: ColumnSettingsComponent },
  { matcher: dataQualityTypeMatcher, component: DataQualityComponent },
  { matcher: derivedColumnsTypeMatcher, component: DerivedColumnsComponent },
  { path: 'cycles', component: CyclesComponent },
  { path: 'email-templates', component: EmailTemplatesComponent },
  { path: 'labels', component: LabelsComponent },
  { path: 'members', component: MembersComponent },
]
