import { Component, ViewEncapsulation } from '@angular/core'
import { MatIcon } from '@angular/material/icon'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-column-geocoding-help',
  templateUrl: './help.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MatIcon],
})

export class ColumnGeocodingHelpComponent {}
