import { NgTemplateOutlet } from '@angular/common'
import type { AfterViewInit, OnChanges, SimpleChanges, TemplateRef } from '@angular/core'
import { Component, Input, ViewEncapsulation } from '@angular/core'
import { Animations } from '@seed/animations'

@Component({
  selector: 'seed-masonry',
  templateUrl: './masonry.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: Animations,
  exportAs: 'seedMasonry',
  imports: [NgTemplateOutlet],
})
export class MasonryComponent implements OnChanges, AfterViewInit {
  @Input() columnsTemplate: TemplateRef<any>
  @Input() columns: number
  @Input() items: any[] = []
  distributedColumns: any[] = []

  ngOnChanges(changes: SimpleChanges): void {
    if ('columns' in changes) {
      this._distributeItems()
    }

    if ('items' in changes) {
      this._distributeItems()
    }
  }

  ngAfterViewInit(): void {
    // Distribute the items for the first time
    this._distributeItems()
  }

  /**
   * Distribute items into columns
   */
  private _distributeItems(): void {
    // Return an empty array if there are no items
    if (this.items.length === 0) {
      this.distributedColumns = []
      return
    }

    // Prepare the distributed columns array
    this.distributedColumns = Array.from(Array(this.columns), (/* item */) => ({
      items: [],
    }))

    // Distribute the items to columns
    for (let i = 0; i < this.items.length; ++i) {
      this.distributedColumns[i % this.columns].items.push(this.items[i])
    }
  }
}
