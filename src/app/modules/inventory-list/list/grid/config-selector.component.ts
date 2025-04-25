import { Component, EventEmitter, Input, Output } from '@angular/core'
import { MatSelectModule } from '@angular/material/select'
import type { Cycle } from '@seed/api/cycle'
import type { Profile } from '../../../inventory/inventory.types'

@Component({
  selector: 'seed-inventory-grid-config-selector',
  templateUrl: './config-selector.component.html',
  imports: [
    MatSelectModule,
  ],
})
export class ConfigSelectorComponent {
  @Input() label = ''
  @Input() items: (Cycle | Profile)[]
  @Input() selectedId: number
  @Output() selectionChange = new EventEmitter<number>()

  onSelectionChange(value: number) {
    this.selectionChange.emit(value)
  }
}
