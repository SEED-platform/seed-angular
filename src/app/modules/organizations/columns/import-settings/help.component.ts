import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-organizations-column-import-settings-help',
  templateUrl: './help.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MaterialImports],
})
export class ColumnImportSettingsHelpComponent {}
