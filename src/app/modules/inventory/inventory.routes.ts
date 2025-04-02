import { inject } from '@angular/core'
import type { ActivatedRouteSnapshot, CanActivateFn, Routes } from '@angular/router'
import { Router } from '@angular/router'
import { InventoryComponent } from 'app/modules/inventory/list/inventory.component'
import { DetailComponent } from './detail/detail.component'
import type { InventoryType } from './inventory.types'

type InventoryParam = {
  type: InventoryType;
}

// guards against invalid view ids
const integerId: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router)
  const id = Number(route.params.id)
  if (!Number.isInteger(id)) {
    void router.navigateByUrl('/dashboard')
    return false
  }
  return true
}

export default [
  // Place new routes like /settings before :id
  {
    path: ':id',
    title: (route) => {
      const type = (route.params as InventoryParam).type
      return type === 'properties' ? 'Property Detail' : 'Tax Lot Detail'
    },
    component: DetailComponent,
    canActivate: [integerId],
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
