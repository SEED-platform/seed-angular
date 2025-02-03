import type { BooleanInput } from '@angular/cdk/coercion'
import { NgClass, NgTemplateOutlet } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, inject, Input, ViewChild } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import type { MatMenu } from '@angular/material/menu'
import { MatMenuModule } from '@angular/material/menu'
import { MatTooltipModule } from '@angular/material/tooltip'
import { Subject, takeUntil } from 'rxjs'
import { HorizontalNavigationBasicItemComponent } from '@seed/components/navigation/horizontal/components/basic/basic.component'
import { HorizontalNavigationDividerItemComponent } from '@seed/components/navigation/horizontal/components/divider/divider.component'
import type { HorizontalNavigationComponent } from '@seed/components/navigation/horizontal/horizontal.component'
import { SeedNavigationService } from '@seed/components/navigation/navigation.service'
import type { NavigationItem } from '@seed/components/navigation/navigation.types'

@Component({
  selector: 'seed-horizontal-navigation-branch-item',
  templateUrl: './branch.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    MatMenuModule,
    NgTemplateOutlet,
    HorizontalNavigationBasicItemComponent,
    forwardRef(() => HorizontalNavigationBranchItemComponent),
    HorizontalNavigationDividerItemComponent,
    MatTooltipModule,
    MatIconModule,
  ],
})
export class HorizontalNavigationBranchItemComponent implements OnInit, OnDestroy {
  static ngAcceptInputType_child: BooleanInput

  private _changeDetectorRef = inject(ChangeDetectorRef)
  private _navigationService = inject(SeedNavigationService)

  @Input() child = false
  @Input() item: NavigationItem
  @Input() name: string
  @ViewChild('matMenu', { static: true }) matMenu: MatMenu

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
    this._unsubscribeAll$.next(null)
    this._unsubscribeAll$.complete()
  }

  triggerChangeDetection(): void {
    // Mark for check
    this._changeDetectorRef.markForCheck()
  }
}
