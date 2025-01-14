import { NgClass } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import type { NavigationItem, VerticalNavigationComponent } from '@seed/components'
import { SeedNavigationService } from '@seed/components'

@Component({
  selector: 'seed-vertical-navigation-divider-item',
  templateUrl: './divider.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class VerticalNavigationDividerItemComponent implements OnInit, OnDestroy {
  private _changeDetectorRef = inject(ChangeDetectorRef)
  private _navigationService = inject(SeedNavigationService)

  @Input() item: NavigationItem
  @Input() name: string

  private _verticalNavigationComponent: VerticalNavigationComponent
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Get the parent navigation component
    this._verticalNavigationComponent = this._navigationService.getComponent(this.name)

    // Subscribe to onRefreshed on the navigation component
    this._verticalNavigationComponent.onRefreshed.pipe(takeUntil(this._unsubscribeAll$)).subscribe(() => {
      // Mark for check
      this._changeDetectorRef.markForCheck()
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
