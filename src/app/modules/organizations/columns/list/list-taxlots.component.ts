import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-columns-list-taxlots',
  templateUrl: './list.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ListTaxLotComponent {
  type = 'taxlots'
}
