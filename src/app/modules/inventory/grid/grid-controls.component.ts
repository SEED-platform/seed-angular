import { Component, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import type { InventoryPagination } from '../inventory.types'

@Component({
  selector: 'seed-inventory-grid-controls',
  templateUrl: './grid-controls.component.html',
  imports: [MatIconModule],
})
export class InventoryGridControlsComponent {
  @Input() pagination!: InventoryPagination
  @Input() onPageChange: (direction: string) => void
  @Input() resetColumns: () => void
}
