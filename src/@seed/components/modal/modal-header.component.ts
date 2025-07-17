import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-modal-header',
  templateUrl: './modal-header.component.html',
  imports: [
    CommonModule,
    MaterialImports,
  ],
})
export class ModalHeaderComponent {
  @Input() close: () => void
  @Input() title: string
  @Input() titleIcon: string
}
