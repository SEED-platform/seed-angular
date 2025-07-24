import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { DataQualityService } from '@seed/api'
import { ProgressBarComponent } from '@seed/components'
import { UploaderService } from '@seed/services/uploader/uploader.service'
import { finalize, switchMap, take, tap } from 'rxjs'
import { Subject } from 'rxjs/internal/Subject'
import type { InventoryType } from '../inventory'
import { DQCResultsModalComponent } from './results-modal.component'

@Component({
  selector: 'seed-dqc-start-modal',
  templateUrl: './start-modal.component.html',
  imports: [ProgressBarComponent],
})
export class DQCStartModalComponent implements OnDestroy, OnInit {
  private _dataQualityService = inject(DataQualityService)
  private _dialog = inject(MatDialog)
  private _dialogRef = inject(MatDialogRef<DQCStartModalComponent>)
  private _uploaderService = inject(UploaderService)
  private readonly _unsubscribeAll$ = new Subject<void>()

  showProgress = false
  progressBarObj = this._uploaderService.defaultProgressBarObj

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    type: InventoryType;
    viewIds: number[];
  }

  ngOnInit() {
    const [propertyViewIds, taxlotViewIds] = this.data.type === 'properties' ? [this.data.viewIds, []] : [[], this.data.viewIds]
    this.progressBarObj.statusMessage = 'Running Data Quality Check...'
    this.showProgress = true
    this._dataQualityService.startDataQualityCheckForOrg(this.data.orgId, propertyViewIds, taxlotViewIds, null)
      .pipe(
        take(1),
        switchMap(({ progress_key }) => {
          return this._uploaderService.checkProgressLoop({
            progressKey: progress_key,
            progressBarObj: this.progressBarObj,
          })
        }),
        tap(({ unique_id }) => { this.openDataQualityResultsModal(unique_id) }),
        finalize(() => { this.showProgress = false }),
      )
      .subscribe()
  }

  openDataQualityResultsModal(dqcId: number) {
    this._dialog.open(DQCResultsModalComponent, {
      width: '50rem',
      data: { orgId: this.data.orgId, dqcId },
    })

    this.close(true)
  }

  close(result?: boolean) {
    this._dialogRef.close(result)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
