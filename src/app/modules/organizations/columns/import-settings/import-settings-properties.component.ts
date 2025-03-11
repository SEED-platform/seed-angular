import { Component, type OnInit, ViewEncapsulation } from '@angular/core'
import { map, takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { ImportSettingsComponent } from './import-settings.component'

@Component({
  selector: 'seed-organizations-column-import-settings-properties',
  templateUrl: './import-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})

export class ImportSettingsPropertiesComponent extends ImportSettingsComponent implements OnInit{
  type = 'properties'

  ngOnInit(): void {
    this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).pipe(
      map((columns) => {
        this.filterColumns(columns)
      }),
    )
  }
}
