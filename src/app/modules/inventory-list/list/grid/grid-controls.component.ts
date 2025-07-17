import { Component, EventEmitter, Input, Output } from '@angular/core'
import { MaterialImports } from '@seed/materials'
import type { Pagination } from 'app/modules/inventory'

@Component({
  selector: 'seed-inventory-grid-controls',
  templateUrl: './grid-controls.component.html',
  imports: [MaterialImports],
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
