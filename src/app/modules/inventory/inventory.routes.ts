import { inject } from '@angular/core'
import type { ActivatedRouteSnapshot, CanActivateFn, Routes } from '@angular/router'
import { Router } from '@angular/router'
import { InventoryResolver } from '@seed/resolvers/inventory.resolver'
import { DetailComponent } from 'app/modules/inventory-detail/detail/detail.component'
import { ColumnListProfilesComponent, GroupsComponent, InventoryComponent, MapComponent } from 'app/modules/inventory-list'
import { AnalysesComponent, CrossCyclesComponent, DetailLayoutComponent, MetersComponent, NotesComponent, SensorsComponent, TimelineComponent, UbidsComponent } from '../inventory-detail'
import { ColumnDetailProfilesComponent } from '../inventory-detail/column-detail-profiles/column-detail-profiles.component'
import { SummaryComponent } from '../inventory-list/summary/summary.component'
import type { InventoryType } from './inventory.types'

type NewType = {
  type: InventoryType;
}

type InventoryParam = NewType
const integerId: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router)
  const id = Number(route.params.id)
  if (!Number.isInteger(id)) {
    void router.navigateByUrl('/data')
    return false
  }
  return true
}

export default [
  // Place new routes like /settings before :id
  {
    path: 'groups',
    title: 'Groups',
    component: GroupsComponent,
  },
  {
    path: 'column-list-profiles',
    title: 'Column Profiles',
    component: ColumnListProfilesComponent,
  },
  {
    path: 'cross-cycles',
    title: 'Cross Cycles',
    component: CrossCyclesComponent,
  },
  {
    path: 'map',
    title: 'Map',
    component: MapComponent,
  },
  {
    path: 'summary',
    title: 'Summary',
    component: SummaryComponent,
  },
  {
    path: ':id',
    title: (route) => {
      const type = (route.params as InventoryParam).type
      return type === 'properties' ? 'Property Detail' : 'Tax Lot Detail'
    },
    component: DetailLayoutComponent,
    resolve: { view: InventoryResolver },
    canActivate: [integerId],
    children: [
      { path: '', component: DetailComponent },
      { path: 'analyses', title: 'Analyses', component: AnalysesComponent },
      { path: 'cross-cycles', title: 'Cross Cycles', component: CrossCyclesComponent },
      { path: 'column-detail-profiles', title: 'Column Detail Profiles', component: ColumnDetailProfilesComponent },
      { path: 'meters', title: 'Meters', component: MetersComponent },
      { path: 'notes', title: 'Notes', component: NotesComponent },
      { path: 'sensors', title: 'Sensors', component: SensorsComponent },
      { path: 'timeline', title: 'Timeline', component: TimelineComponent },
      { path: 'ubids', title: 'UBIDs', component: UbidsComponent },
    ],
  },
  {
    path: '',
    title: (route) => {
      const type = (route.params as InventoryParam).type
      return type === 'properties' ? 'Properties' : 'Tax Lots'
    },
    component: InventoryComponent,
  },
] satisfies Routes
