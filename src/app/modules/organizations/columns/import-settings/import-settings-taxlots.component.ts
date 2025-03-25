import { Component, type OnInit, ViewEncapsulation } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { map, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { ImportSettingsComponent } from './import-settings.component'

@Component({
  selector: 'seed-organizations-column-import-settings-taxlots',
  templateUrl: './import-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MatButtonModule, MatIconModule, MatSelectModule, ReactiveFormsModule],
})
export class ImportSettingsTaxLotsComponent extends ImportSettingsComponent implements OnInit {
  type = 'TaxLotState'

  ngOnInit(): void {
    this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).pipe(
      map((columns) => {
        this.prepareColumns(columns)
      }),
    ).subscribe()
  }
}
