import type { UrlSegment } from '@angular/router'
import type { OrganizationGenericTypeMatcher } from './organizations.types'
import {
  AccessLevelTreeComponent,
  ColumnsComponent,
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

const dataQualityTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['goal', 'properties', 'taxlots'], validPage: 'data-quality' }
  return genericTypeMatcher(args)(segments)
}

const derivedColumnsTypeMatcher = (segments: UrlSegment[]) => {
  const args = { segments, validTypes: ['properties', 'taxlots'], validPage: 'derived-columns' }
  return genericTypeMatcher(args)(segments)
}

export default [
  { path: 'settings', component: SettingsComponent, loadChildren: () => import('app/modules/organizations/settings/settings.routes') },
  { path: 'access-level-tree', component: AccessLevelTreeComponent },
  { path: 'columns', component: ColumnsComponent, loadChildren: () => import('app/modules/organizations/columns/columns.routes') },
  { matcher: dataQualityTypeMatcher, component: DataQualityComponent },
  { matcher: derivedColumnsTypeMatcher, component: DerivedColumnsComponent },
  { path: 'cycles', component: CyclesComponent },
  { path: 'email-templates', component: EmailTemplatesComponent },
  { path: 'labels', component: LabelsComponent },
  { path: 'members', component: MembersComponent },
]
