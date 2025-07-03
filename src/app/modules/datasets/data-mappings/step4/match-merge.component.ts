import { CommonModule } from '@angular/common'
import type { OnDestroy } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { RouterModule } from '@angular/router'
import { MappingService } from '@seed/api/mapping'
import type { SubProgressResponse } from '@seed/api/progress'
import { ProgressBarComponent } from '@seed/components'
import type { CheckProgressLoopParams} from '@seed/services/uploader'
import { UploaderService } from '@seed/services/uploader'
import { finalize, Subject, switchMap, takeUntil, tap } from 'rxjs'

@Component({
  selector: 'seed-match-merge',
  templateUrl: './match-merge.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    ProgressBarComponent,
    RouterModule,
  ],
})
export class MatchMergeComponent implements OnDestroy {
  @Input() importFileId: number
  @Input() orgId: number
  @Input() inventoryType

  private _mappingService = inject(MappingService)
  private _uploaderService = inject(UploaderService)
  private readonly _unsubscribeAll$ = new Subject<void>()
  inProgress = true

  progressBarObj = this._uploaderService.defaultProgressBarObj
  subProgressBarObj = this._uploaderService.defaultProgressBarObj

  startMatchMerge() {
    this._mappingService.mappingDone(this.orgId, this.importFileId)
      .pipe(
        switchMap(() => this._mappingService.startMatchMerge(this.orgId, this.importFileId)),
        switchMap((data) => this.checkProgress(data)),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe()
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
      .pipe(
        tap(([_, subProgress]) => {
          console.log('subProgress', subProgress.status_message, this.subProgressBarObj.statusMessage, this.subProgressBarObj.progress)
        }),
        finalize(() => {
          console.log('final main progressBarObj', this.progressBarObj)
          console.log('final sub progressBarObj', this.subProgressBarObj)
        }),
      )
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
