import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-modal-header',
  templateUrl: './modal-header.component.html',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
})
export class ModalHeaderComponent {
  @Input() close: () => void
  @Input() title: string
  @Input() titleIcon: string
}
