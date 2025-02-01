import { NgClass } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core'
import { Subject, takeUntil } from 'rxjs'
import type { HorizontalNavigationComponent } from '@seed/components/navigation/horizontal/horizontal.component'
import { SeedNavigationService } from '@seed/components/navigation/navigation.service'
import type { NavigationItem } from '@seed/components/navigation/navigation.types'

@Component({
  selector: 'seed-horizontal-navigation-spacer-item',
  templateUrl: './spacer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class HorizontalNavigationSpacerItemComponent implements OnInit, OnDestroy {
  private _changeDetectorRef = inject(ChangeDetectorRef)
  private _navigationService = inject(SeedNavigationService)

  @Input() item: NavigationItem
  @Input() name: string

  private _horizontalNavigationComponent: HorizontalNavigationComponent
  private readonly _unsubscribeAll$ = new Subject<void>()

  ngOnInit(): void {
    // Get the parent navigation component
    this._horizontalNavigationComponent = this._navigationService.getComponent(this.name)

    // Subscribe to onRefreshed on the navigation component
    this._horizontalNavigationComponent.onRefreshed.pipe(takeUntil(this._unsubscribeAll$)).subscribe(() => {
      // Mark for check
      this._changeDetectorRef.markForCheck()
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
