import { Component, EventEmitter, Input, Output } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import type { Pagination } from '../../../inventory/inventory.types'

@Component({
  selector: 'seed-inventory-grid-controls',
  templateUrl: './grid-controls.component.html',
  imports: [MatIconModule, MatTooltipModule],
})
export class InventoryGridControlsComponent {
  @Input() pagination!: Pagination
  @Input() resetGrid: () => void
  @Input() selectedViewIds: number[]
  @Output() pageChange = new EventEmitter<number>()

  onPageChange = (direction: 'first' | 'previous' | 'next' | 'last') => {
    const { page, num_pages } = this.pagination
    const pageLookup = { first: 1, previous: page - 1, next: page + 1, last: num_pages }

    const newPage = pageLookup[direction]
    if (newPage < 1 || newPage > num_pages) return

    this.pageChange.emit(newPage)
  }
}
