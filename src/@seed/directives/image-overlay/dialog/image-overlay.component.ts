import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import type { ImageOverlayData } from '../image-overlay.types'

@Component({
  selector: 'seed-image-overlay',
  templateUrl: './image-overlay.component.html',
  imports: [MatButtonModule, MatDialogModule],
  styles: ':host { @apply flex }',
})
export class OverlayImageComponent {
  data = inject(MAT_DIALOG_DATA) as ImageOverlayData
}
