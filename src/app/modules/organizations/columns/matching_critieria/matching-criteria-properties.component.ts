import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-column-matching-criteria-properties',
  templateUrl: './matching-criteria.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class MatchingCriteriaPropertiesComponent {
  type = 'properties'
}
