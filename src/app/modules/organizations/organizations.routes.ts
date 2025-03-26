import { inject } from '@angular/core'
import type { Routes, UrlSegment } from '@angular/router'
import { switchMap, take } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { UserService } from '@seed/api/user'
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
  {
    path: 'access-level-tree',
    title: 'Access Level Tree',
    component: AccessLevelTreeComponent,
    resolve: {
      accessLevelTree: () => {
        const organizationService = inject(OrganizationService)
        const userService = inject(UserService)
        return userService.currentOrganizationId$.pipe(
          take(1),
          switchMap(() => {
            return organizationService.accessLevelTree$
          }),
        )
      },
    },
  },
  {
    matcher: columnMappingTypeMatcher,
    title: 'Column Mappings',
    component: ColumnMappingsComponent,
  },
  {
    matcher: columnSettingsTypeMatcher,
    title: 'Column Settings',
    component: ColumnSettingsComponent,
  },
  {
    matcher: dataQualityTypeMatcher,
    title: 'Data Quality',
    component: DataQualityComponent,
  },
  {
    matcher: derivedColumnsTypeMatcher,
    title: 'Derived Columns',
    component: DerivedColumnsComponent,
  },
  {
    path: 'cycles',
    title: 'Cycles',
    component: CyclesComponent,
  },
  {
    path: 'email-templates',
    title: 'Email Templates',
    component: EmailTemplatesComponent,
  },
  {
    path: 'labels',
    title: 'Labels',
    component: LabelsComponent,
  },
  {
    path: 'members',
    title: 'Members',
    component: MembersComponent,
  },
] satisfies Routes
