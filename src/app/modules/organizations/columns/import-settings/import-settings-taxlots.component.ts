import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-column-import-settings-taxlots',
  templateUrl: './import-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ImportSettingsTaxLotsComponent {
  type = 'taxlots'
}
