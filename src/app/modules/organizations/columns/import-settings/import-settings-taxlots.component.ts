import { Component, type OnInit, ViewEncapsulation } from '@angular/core'
import { map, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { ImportSettingsComponent } from './import-settings.component'

@Component({
  selector: 'seed-organizations-column-import-settings-taxlots',
  templateUrl: './import-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ImportSettingsTaxLotsComponent extends ImportSettingsComponent implements OnInit {
  type = 'taxlots'

  ngOnInit(): void {
    this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).pipe(
      map((columns) => {
        this.filterColumns(columns)
      }),
    )
  }
}
