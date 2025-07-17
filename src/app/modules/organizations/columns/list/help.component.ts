import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-organizations-column-list-help',
  templateUrl: './help.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MaterialImports],
})
export class ColumnListHelpComponent {}
