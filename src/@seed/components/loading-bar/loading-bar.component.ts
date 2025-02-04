import type { OnDestroy, OnInit } from '@angular/core'
import { booleanAttribute, Component, inject, input, ViewEncapsulation } from '@angular/core'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { Subject, takeUntil } from 'rxjs'
import { LoadingService } from '@seed/services'

@Component({
  selector: 'seed-loading-bar',
  templateUrl: './loading-bar.component.html',
  styleUrl: './loading-bar.component.scss',
  encapsulation: ViewEncapsulation.None,
  exportAs: 'seedLoadingBar',
  imports: [MatProgressBarModule],
})
export class SEEDLoadingBarComponent implements OnInit, OnDestroy {
  private _loadingService = inject(LoadingService)

  autoMode = input(true, { transform: booleanAttribute })
  mode: 'determinate' | 'indeterminate'
  progress = 0
  show = false
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Subscribe to the service
    this._loadingService.mode$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((value) => {
      this.mode = value
    })

    this._loadingService.progress$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((value) => {
      this.progress = value
    })

    this._loadingService.show$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((value) => {
      this.show = value
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
