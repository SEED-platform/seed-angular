import type { Routes } from '@angular/router'
import { InventoryComponent } from 'app/modules/inventory/list/inventory.component'
import type { InventoryType } from './inventory.types'

type InventoryParam = {
  type: InventoryType;
}

export default [
  {
    path: '',
    title: (route) => {
      const type = (route.params as InventoryParam).type
      return type === 'properties' ? 'Properties' : 'Tax Lots'
    },
    component: InventoryComponent,
  },
] satisfies Routes
