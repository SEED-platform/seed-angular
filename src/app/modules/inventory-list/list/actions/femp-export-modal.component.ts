import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { finalize, Subject, tap } from 'rxjs'
import { InventoryService } from '@seed/api'
import { ModalHeaderComponent, ProgressBarComponent } from '@seed/components'
import { MaterialImports } from '@seed/materials'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-femp-export-modal',
  templateUrl: './femp-export-modal.component.html',
  imports: [
    FormsModule,
    MaterialImports,
    ModalHeaderComponent,
    ProgressBarComponent,
  ],
})
export class FempExportModalComponent implements OnDestroy {
  private _dialog = inject(MatDialogRef<FempExportModalComponent>)
  private _inventoryService = inject(InventoryService)
  private _snackBar = inject(SnackBarService)
  private _unsubscribeAll$ = new Subject<void>()

  exportType: 'evaluation' | 'facility' = 'evaluation'
  filename = ''
  inProgress = false

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    viewIds: number[];
    type: InventoryType;
  }

  setExportType(type: 'evaluation' | 'facility'): void {
    this.exportType = type
  }

  onSubmit() {
    this.inProgress = true
    const exportRequest = this.exportType === 'evaluation'
      ? this._inventoryService.evaluationExportToCts(this.data.orgId, this.data.viewIds, this.filename)
      : this._inventoryService.facilityBpsExportToCts(this.data.orgId, this.data.viewIds, this.filename)

    exportRequest
      .pipe(
        tap((response) => { this.downloadData(response) }),
        finalize(() => {
          this.inProgress = false
          this.close()
        }),
      ).subscribe()
  }

  downloadData(data: Blob) {
    const a = document.createElement('a')
    const url = URL.createObjectURL(data)
    a.href = url
    a.download = this.filename
    a.click()
    URL.revokeObjectURL(url)
    this._snackBar.success(`Exported ${this.filename}`)
  }

  close(): void {
    this._dialog.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
