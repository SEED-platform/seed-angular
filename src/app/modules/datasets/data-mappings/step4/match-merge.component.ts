import { CommonModule } from '@angular/common'
import type { OnDestroy } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { RouterModule } from '@angular/router'
import { of, Subject, switchMap, takeUntil } from 'rxjs'
import { MappingService } from '@seed/api/mapping'
import type { ProgressResponse, SubProgressResponse } from '@seed/api/progress'
import { ProgressBarComponent } from '@seed/components'
import type { CheckProgressLoopParams } from '@seed/services/uploader'
import { UploaderService } from '@seed/services/uploader'
import type { InventoryType } from 'app/modules/inventory'
import { ResultsComponent } from './results.component'

@Component({
  selector: 'seed-match-merge',
  templateUrl: './match-merge.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    ProgressBarComponent,
    RouterModule,
    ResultsComponent,
  ],
})
export class MatchMergeComponent implements OnDestroy {
  @Input() importFileId: number
  @Input() orgId: number
  @Input() inventoryType: InventoryType

  private _mappingService = inject(MappingService)
  private _uploaderService = inject(UploaderService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  inProgress = true

  progressBarObj = this._uploaderService.defaultProgressBarObj
  subProgressBarObj = this._uploaderService.defaultProgressBarObj

  startMatchMerge() {
    this.inProgress = true
    this._mappingService.mappingDone(this.orgId, this.importFileId)
      .pipe(
        switchMap(() => this._mappingService.startMatchMerge(this.orgId, this.importFileId)),
        switchMap((response) => this.checkProgressResponse(response)),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
  }

  checkProgressResponse(response: ProgressResponse | SubProgressResponse) {
    // check if its already matched and skip progress step
    if ((response as ProgressResponse).progress === 100) {
      this.inProgress = false
      return of(null)
    }
    return this.checkProgress(response as SubProgressResponse)
  }

  checkProgress(data: SubProgressResponse) {
    const successFn = () => {
      this.inProgress = false
    }

    const { progress_data, sub_progress_data } = data
    const baseParams = { offset: 0, multiplier: 1 }
    const mainParams: CheckProgressLoopParams = {
      progressKey: progress_data.progress_key,
      successFn,
      failureFn: () => void 0,
      progressBarObj: this.progressBarObj,
      ...baseParams,
    }

    const subParams: CheckProgressLoopParams = {
      progressKey: sub_progress_data.progress_key,
      successFn: () => void 0,
      failureFn: () => void 0,
      progressBarObj: this.subProgressBarObj,
      ...baseParams,
    }

    return this._uploaderService.checkProgressLoopMainSub(mainParams, subParams)
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
