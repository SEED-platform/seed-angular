import type { OnChanges, OnDestroy, SimpleChanges } from '@angular/core'
import { Component } from '@angular/core'
import { ProgressBarComponent } from '@seed/components'
import { Subject } from 'rxjs'

@Component({
  selector: 'seed-match-merge',
  templateUrl: './match-marge.component.html',
  imports: [
    ProgressBarComponent,
  ],
})
export class MatchMergeComponent implements OnChanges, OnDestroy {
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnChanges(changes: SimpleChanges): void {
    if (changes) { // what changes?
      // do something
    }
  }

  startMatchMerge() {
    console.log('start match merge')
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
