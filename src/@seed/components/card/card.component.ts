import type { BooleanInput } from '@angular/cdk/coercion'
import { coerceBooleanProperty } from '@angular/cdk/coercion'
import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core'
import { Animations } from '@seed/animations'
import type { CardFace } from '@seed/components'

@Component({
  selector: 'seed-card',
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: Animations,
  exportAs: 'card',
})
export class CardComponent implements OnChanges {
  static ngAcceptInputType_expanded: BooleanInput
  static ngAcceptInputType_flippable: BooleanInput

  @Input() expanded = false
  @Input() face: CardFace = 'front'
  @Input() flippable = false

  /**
   * Host binding for component classes
   */
  @HostBinding('class') get classList(): Record<string, boolean> {
    return {
      'card-expanded': this.expanded,
      'card-face-back': this.flippable && this.face === 'back',
      'card-face-front': this.flippable && this.face === 'front',
      'card-flippable': this.flippable,
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Expanded
    if ('expanded' in changes) {
      // Coerce the value to a boolean
      this.expanded = coerceBooleanProperty(changes.expanded.currentValue)
    }

    // Flippable
    if ('flippable' in changes) {
      // Coerce the value to a boolean
      this.flippable = coerceBooleanProperty(changes.flippable.currentValue)
    }
  }
}
