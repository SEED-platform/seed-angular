import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, Input } from '@angular/core'
import type { ViewResponse } from '../../inventory.types'

@Component({
  selector: 'seed-inventory-detail-scenarios-grid',
  templateUrl: './scenarios-grid.component.html',
  imports: [
  ],
})
export class ScenariosGridComponent implements OnChanges {
  @Input() view: ViewResponse
  @Input() viewId: number

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes)
    console.log(this.view)
  }
}
