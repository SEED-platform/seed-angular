import type { BooleanInput } from '@angular/cdk/coercion'
import { NgClass } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { Subject, takeUntil } from 'rxjs'
import type { NavigationItem, VerticalNavigationComponent } from '@seed/components'
import {
  SeedNavigationService,
  VerticalNavigationBasicItemComponent,
  VerticalNavigationCollapsibleItemComponent,
  VerticalNavigationDividerItemComponent,
  VerticalNavigationSpacerItemComponent,
} from '@seed/components'

@Component({
  selector: 'seed-vertical-navigation-group-item',
  templateUrl: './group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    MatIconModule,
    VerticalNavigationBasicItemComponent,
    VerticalNavigationCollapsibleItemComponent,
    VerticalNavigationDividerItemComponent,
    VerticalNavigationSpacerItemComponent,
  ],
})
export class VerticalNavigationGroupItemComponent implements OnInit, OnDestroy {
  static ngAcceptInputType_autoCollapse: BooleanInput

  private _changeDetectorRef = inject(ChangeDetectorRef)
  private _navigationService = inject(SeedNavigationService)

  @Input() autoCollapse: boolean
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
