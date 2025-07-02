import { CommonModule } from '@angular/common'
import type { OnDestroy } from '@angular/core'
import { Component, inject, Input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { RouterModule } from '@angular/router'
import { MappingService } from '@seed/api/mapping'
import { SubProgressResponse } from '@seed/api/progress'
import { ProgressBarComponent } from '@seed/components'
import { UploaderService } from '@seed/services/uploader'
import { Subject, switchMap, take } from 'rxjs'

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
        take(1),
        switchMap(() => this._mappingService.startMatchMerge(this.orgId, this.importFileId)),
        take(1),
        switchMap((data) => this.checkProgress(data)),
      )
      .subscribe()
  }

  checkProgress(data: SubProgressResponse) {
    const successFn = () => {
      console.log('success')
      this.inProgress = false
    }
    const failureFn = () => {
      console.log('failure')
    }

    const { progress_data } = data

    return this._uploaderService.checkProgressLoop({
      progressKey: progress_data.progress_key,
      offset: 0,
      multiplier: 1,
      successFn,
      failureFn,
      progressBarObj: this.progressBarObj,
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
