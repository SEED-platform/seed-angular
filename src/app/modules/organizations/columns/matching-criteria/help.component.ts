import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-organizations-column-matching-criteria-help',
  templateUrl: './help.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MaterialImports],
})
export class ColumnMatchingCriteriaHelpComponent {}
