import { CommonModule } from '@angular/common'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import type { ConfirmationConfig } from '..'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-confirmation-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MaterialImports],
})
export class ConfirmationDialogComponent {
  data = inject(MAT_DIALOG_DATA) as ConfirmationConfig
}
