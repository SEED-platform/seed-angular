import type { AnimationPlayer } from '@angular/animations'
import { animate, AnimationBuilder, style } from '@angular/animations'
import type { BooleanInput } from '@angular/cdk/coercion'
import { coerceBooleanProperty } from '@angular/cdk/coercion'
import type { OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core'
import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  inject,
  Input,
  Output,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core'
import { randomId } from '@seed/utils'
import { DrawerService } from './drawer.service'
import type { DrawerMode, DrawerPosition } from './drawer.types'

@Component({
  selector: 'seed-drawer',
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss',
  encapsulation: ViewEncapsulation.None,
  exportAs: 'seedDrawer',
})
export class DrawerComponent implements OnChanges, OnInit, OnDestroy {
  private _animationBuilder = inject(AnimationBuilder)
  private _elementRef = inject<ElementRef<HTMLElement>>(ElementRef)
  private _renderer2 = inject(Renderer2)
  private _drawerService = inject(DrawerService)

  static ngAcceptInputType_fixed: BooleanInput
  static ngAcceptInputType_opened: BooleanInput
  static ngAcceptInputType_transparentOverlay: BooleanInput

  @Input() fixed = false
  @Input() mode: DrawerMode = 'side'
  @Input() name: string = randomId()
  @Input() opened = false
  @Input() position: DrawerPosition = 'left'
  @Input() transparentOverlay = false
  @Output() readonly fixedChanged: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() readonly modeChanged: EventEmitter<DrawerMode> = new EventEmitter<DrawerMode>()
  @Output() readonly openedChanged: EventEmitter<boolean> = new EventEmitter<boolean>()
  @Output() readonly positionChanged: EventEmitter<DrawerPosition> = new EventEmitter<DrawerPosition>()

  private _animationsEnabled = false
  private _hovered = false
  private _overlay?: HTMLElement
  private _player: AnimationPlayer

  @HostBinding('class') get classList(): Record<string, boolean> {
    return {
      'drawer-animations-enabled': this._animationsEnabled,
      'drawer-fixed': this.fixed,
      'drawer-hover': this._hovered,
      [`drawer-mode-${this.mode}`]: true,
      'drawer-opened': this.opened,
      [`drawer-position-${this.position}`]: true,
    }
  }

  @HostBinding('style') get styleList(): Record<string, string> {
    return {
      visibility: this.opened ? 'visible' : 'hidden',
    }
  }

  @HostListener('mouseenter')
  private _onMouseenter(): void {
    // Enable the animations
    this._enableAnimations()

    // Set the hovered
    this._hovered = true
  }

  @HostListener('mouseleave')
  private _onMouseleave(): void {
    // Enable the animations
    this._enableAnimations()

    // Set the hovered
    this._hovered = false
  }

  ngOnInit(): void {
    // Register the drawer
    this._drawerService.registerComponent(this.name, this)
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Fixed
    if ('fixed' in changes) {
      // Coerce the value to a boolean
      this.fixed = coerceBooleanProperty(changes.fixed.currentValue)

      // Execute the observable
      this.fixedChanged.next(this.fixed)
    }

    // Mode
    if ('mode' in changes) {
      // Get the previous and current values
      const previousMode = changes.mode.previousValue
      const currentMode = changes.mode.currentValue

      // Disable the animations
      this._disableAnimations()

      // If the mode changes: 'over -> side'
      if (previousMode === 'over' && currentMode === 'side') {
        // Hide the overlay
        this._hideOverlay()
      }

      // If the mode changes: 'side -> over'
      if (previousMode === 'side' && currentMode === 'over') {
        // If the drawer is opened
        if (this.opened) {
          // Show the overlay
          this._showOverlay()
        }
      }

      // Execute the observable
      this.modeChanged.next(currentMode)

      // Enable the animations after a delay
      // The delay must be bigger than the current transition-duration
      // to make sure nothing will be animated while the mode is changing
      setTimeout(() => {
        this._enableAnimations()
      }, 500)
    }

    // Opened
    if ('opened' in changes) {
      // Coerce the value to a boolean
      const open = coerceBooleanProperty(changes.opened.currentValue)

      // Open/close the drawer
      this._toggleOpened(open)
    }

    // Position
    if ('position' in changes) {
      // Execute the observable
      this.positionChanged.next(this.position)
    }

    // Transparent overlay
    if ('transparentOverlay' in changes) {
      // Coerce the value to a boolean
      this.transparentOverlay = coerceBooleanProperty(changes.transparentOverlay.currentValue)
    }
  }

  ngOnDestroy(): void {
    // Finish the animation
    if (this._player) {
      this._player.finish()
    }

    // Deregister the drawer from the registry
    this._drawerService.deregisterComponent(this.name)
  }

  /**
   * Open the drawer
   */
  open(): void {
    // Return if the drawer has already opened
    if (this.opened) {
      return
    }

    // Open the drawer
    this._toggleOpened(true)
  }

  /**
   * Close the drawer
   */
  close(): void {
    // Return if the drawer has already closed
    if (!this.opened) {
      return
    }

    // Close the drawer
    this._toggleOpened(false)
  }

  /**
   * Toggle the drawer
   */
  toggle(): void {
    if (this.opened) {
      this.close()
    } else {
      this.open()
    }
  }

  private readonly _handleOverlayClick = (): void => {
    this.close()
  }

  private _enableAnimations(): void {
    this._animationsEnabled = true
  }

  private _disableAnimations(): void {
    this._animationsEnabled = false
  }

  /**
   * Show the backdrop
   *
   * @private
   */
  private _showOverlay(): void {
    // Create the backdrop element
    this._overlay = this._renderer2.createElement('div') as HTMLDivElement

    // Add a class to the backdrop element
    this._overlay.classList.add('drawer-overlay')

    // Add a class depending on the fixed option
    if (this.fixed) {
      this._overlay.classList.add('drawer-overlay-fixed')
    }

    // Add a class depending on the transparentOverlay option
    if (this.transparentOverlay) {
      this._overlay.classList.add('drawer-overlay-transparent')
    }

    // Append the backdrop to the parent of the drawer
    this._renderer2.appendChild(this._elementRef.nativeElement.parentElement, this._overlay)

    // Create enter animation and attach it to the player
    this._player = this._animationBuilder
      .build([style({ opacity: 0 }), animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 1 }))])
      .create(this._overlay)

    // Play the animation
    this._player.play()

    // Add an event listener to the overlay
    this._overlay.addEventListener('click', this._handleOverlayClick)
  }

  /**
   * Hide the backdrop
   *
   * @private
   */
  private _hideOverlay(): void {
    if (!this._overlay) {
      return
    }

    // Create the leave animation and attach it to the player
    this._player = this._animationBuilder
      .build([animate('300ms cubic-bezier(0.25, 0.8, 0.25, 1)', style({ opacity: 0 }))])
      .create(this._overlay)

    // Play the animation
    this._player.play()

    // Once the animation is done...
    this._player.onDone(() => {
      // If the overlay still exists...
      if (this._overlay) {
        // Remove the event listener
        this._overlay.removeEventListener('click', this._handleOverlayClick)

        // Remove the overlay
        this._overlay.parentNode?.removeChild(this._overlay)
        this._overlay = undefined
      }
    })
  }

  /**
   * Open/close the drawer
   *
   * @param open
   * @private
   */
  private _toggleOpened(open: boolean): void {
    this.opened = open

    this._enableAnimations()

    if (this.mode === 'over') {
      if (open) {
        this._showOverlay()
      } else {
        this._hideOverlay()
      }
    }

    // Execute the observable
    this.openedChanged.next(open)
  }
}
