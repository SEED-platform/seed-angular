import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-column-data-types-taxlots',
  templateUrl: './data-types.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class DataTypesTaxLotsComponent {
  type = 'taxlots'
}
