import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { finalize, Subject, switchMap, take, tap } from 'rxjs'
import { DataQualityService } from '@seed/api/data-quality'
import { ProgressBarComponent } from '@seed/components'
import { UploaderService } from '@seed/services/uploader'
import { ResultsModalComponent } from 'app/modules/data-quality'
import type { InventoryType } from 'app/modules/inventory/inventory.types'

@Component({
  selector: 'seed-inventory-more-actions-modal',
  templateUrl: './more-actions-modal.component.html',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ProgressBarComponent,
    ResultsModalComponent,
  ],
})
export class MoreActionsModalComponent implements OnDestroy {
  private _dataQualityService = inject(DataQualityService)
  private _dialog = inject(MatDialog)
  private _uploaderService = inject(UploaderService)
  private _dialogRef = inject(MatDialogRef<MoreActionsModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  data = inject(MAT_DIALOG_DATA) as { viewIds: number[]; orgId: number; type: InventoryType }
  errorMessage = false
  progressBarObj = this._uploaderService.defaultProgressBarObj
  showProgress = false
  progressTitle = ''

  actionsColumn1 = [
    { name: 'Analysis: Run', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Audit Template: Export', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Audit Template: Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Change Access Level', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Data Quality Check', action: () => { this.dataQualityCheck() }, disabled: !this.data.viewIds.length },
    { name: 'Delete', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Derived Data: Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Email', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Export', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'FEMP CTS Reporting Export', action: this.tempAction, disabled: !this.data.viewIds.length },
  ]
  actionsColumn2 = [
    { name: 'Geocode', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Groups: Add / Remove', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Labels: Add / Remove', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Merge', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Set Update Time to Now', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Salesforce: Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'UBID: Add / Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'UBID: Compare', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'UBID: Decode', action: this.tempAction, disabled: !this.data.viewIds.length },
  ]

  tempAction() {
    console.log('temp action')
  }

  dataQualityCheck() {
    const [propertyViewIds, taxlotViewIds] = this.data.type === 'properties' ? [this.data.viewIds, []] : [[], this.data.viewIds]
    this.progressBarObj.statusMessage = 'Running Data Quality Check...'
    this.showProgress = true
    this._dataQualityService.startDataQualityCheckForOrg(this.data.orgId, propertyViewIds, taxlotViewIds, null)
      .pipe(
        take(1),
        switchMap(({ progress_key }) => {
          return this._uploaderService.checkProgressLoop({
            progressKey: progress_key,
            offset: 0,
            multiplier: 1,
            successFn: () => null,
            failureFn: () => null,
            progressBarObj: this.progressBarObj,
          })
        }),
        tap(({ unique_id }) => { this.openDataQualityResultsModal(unique_id) }),
        finalize(() => { this.showProgress = false }),
      )
      .subscribe()
  }

  openDataQualityResultsModal(dqcId: number) {
    this._dialog.open(ResultsModalComponent, {
      width: '50rem',
      data: { orgId: this.data.orgId, dqcId },
    })

    this.close(true)
  }

  close(refresh = false) {
    this._dialogRef.close(refresh)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
