import type { BooleanInput } from '@angular/cdk/coercion'
import { coerceBooleanProperty } from '@angular/cdk/coercion'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  Output,
  ViewEncapsulation,
} from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { filter, Subject, takeUntil } from 'rxjs'
import { Animations } from '@seed/animations'
import { randomId } from '@seed/utils'
import { AlertService } from './alert.service'
import type { AlertAppearance, AlertType } from './alert.types'

@Component({
  selector: 'seed-alert',
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: Animations,
  exportAs: 'seedAlert',
  imports: [MatButtonModule, MatIconModule],
})
export class AlertComponent implements OnChanges, OnInit, OnDestroy {
  static ngAcceptInputType_dismissible: BooleanInput
  static ngAcceptInputType_dismissed: BooleanInput
  static ngAcceptInputType_showIcon: BooleanInput

  private _changeDetectorRef = inject(ChangeDetectorRef)
  private _alertService = inject(AlertService)

  @Input() appearance: AlertAppearance = 'soft'
  @Input() dismissed = false
  @Input() dismissible = false
  @Input() name: string = randomId()
  @Input() showIcon = true
  @Input() type: AlertType = 'primary'
  @Output() readonly dismissedChanged: EventEmitter<boolean> = new EventEmitter<boolean>()

  private readonly _unsubscribeAll$ = new Subject<void>()

  /**
   * Host binding for component classes
   */
  @HostBinding('class') get classList(): Record<string, boolean> {
    return {
      'seed-alert-appearance-border': this.appearance === 'border',
      'seed-alert-appearance-fill': this.appearance === 'fill',
      'seed-alert-appearance-outline': this.appearance === 'outline',
      'seed-alert-appearance-soft': this.appearance === 'soft',
      'seed-alert-dismissed': this.dismissed,
      'seed-alert-dismissible': this.dismissible,
      'seed-alert-show-icon': this.showIcon,
      'seed-alert-type-primary': this.type === 'primary',
      'seed-alert-type-accent': this.type === 'accent',
      'seed-alert-type-warn': this.type === 'warn',
      'seed-alert-type-basic': this.type === 'basic',
      'seed-alert-type-info': this.type === 'info',
      'seed-alert-type-success': this.type === 'success',
      'seed-alert-type-warning': this.type === 'warning',
      'seed-alert-type-error': this.type === 'error',
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Dismissed
    if ('dismissed' in changes) {
      // Coerce the value to a boolean
      this.dismissed = coerceBooleanProperty(changes.dismissed.currentValue)

      // Dismiss/show the alert
      this._toggleDismiss(this.dismissed)
    }

    // Dismissible
    if ('dismissible' in changes) {
      // Coerce the value to a boolean
      this.dismissible = coerceBooleanProperty(changes.dismissible.currentValue)
    }

    // Show icon
    if ('showIcon' in changes) {
      // Coerce the value to a boolean
      this.showIcon = coerceBooleanProperty(changes.showIcon.currentValue)
    }
  }

  ngOnInit(): void {
    // Subscribe to the dismiss calls
    this._alertService.onDismiss
      .pipe(
        filter((name) => this.name === name),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe(() => {
        // Dismiss the alert
        this.dismiss()
      })

    // Subscribe to the show calls
    this._alertService.onShow
      .pipe(
        filter((name) => this.name === name),
        takeUntil(this._unsubscribeAll$),
      )
      .subscribe(() => {
        // Show the alert
        this.show()
      })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  /**
   * Dismiss the alert
   */
  dismiss(): void {
    // Return if the alert is already dismissed
    if (this.dismissed) {
      return
    }

    // Dismiss the alert
    this._toggleDismiss(true)
  }

  /**
   * Show the dismissed alert
   */
  show(): void {
    // Return if the alert is already showing
    if (!this.dismissed) {
      return
    }

    // Show the alert
    this._toggleDismiss(false)
  }

  /**
   * Dismiss/show the alert
   *
   * @param dismissed
   * @private
   */
  private _toggleDismiss(dismissed: boolean): void {
    // Return if the alert is not dismissible
    if (!this.dismissible) {
      return
    }

    // Set the dismissed
    this.dismissed = dismissed

    // Execute the observable
    this.dismissedChanged.next(this.dismissed)

    // Notify the change detector
    this._changeDetectorRef.markForCheck()
  }
}
