import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import type { Analysis } from '@seed/api/analysis'
import { AnalysisService } from '@seed/api/analysis'
import { SharedImports } from '@seed/directives'
import { finalize } from 'rxjs'

@Component({
  selector: 'seed-delete-analysis-dialog',
  templateUrl: './delete-analysis-dialog.component.html',
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule, SharedImports],
})
export class DeleteAnalysisDialogComponent {
  private _data = inject(MAT_DIALOG_DATA) as { analysis: Analysis }
  private _dialogRef = inject(MatDialogRef<DeleteAnalysisDialogComponent>)
  private _analysisService = inject(AnalysisService)

  readonly analysis = this._data.analysis
  submitted = false

  delete() {
    console.log('Delete analysis', this.analysis.id)
    if (!this.submitted) {
      this.submitted = true
      this._analysisService
        .delete(this._data.analysis.id)
        .pipe(
          finalize(() => {
            this._dialogRef.close()
          }),
        )
        .subscribe()
    } else {
      this._dialogRef.close()
    }
  }
  close() {
    this._dialogRef.close()
  }

  dismiss() {
    this._dialogRef.close()
  }
}
