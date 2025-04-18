import { CommonModule } from '@angular/common'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import type { ConfirmationConfig } from '..'

@Component({
  selector: 'seed-confirmation-dialog',
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
})
export class ConfirmationDialogComponent {
  data = inject(MAT_DIALOG_DATA) as ConfirmationConfig
}
