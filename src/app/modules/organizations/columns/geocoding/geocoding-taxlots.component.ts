import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-column-geocoding-taxlots',
  templateUrl: './geocoding.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class GeocodingTaxlotsComponent {
  type = 'taxlots'
}
