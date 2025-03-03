import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-column-matching-criteria-taxlots',
  templateUrl: './matching-criteria.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class MatchingCriteriaTaxLotsComponent {
  type = 'taxlots'
}
