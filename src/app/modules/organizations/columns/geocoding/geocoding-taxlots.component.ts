import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop'
import { Component, type OnInit, ViewEncapsulation } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltip } from '@angular/material/tooltip'
import { takeUntil } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { GeocodingComponent } from './geocoding.component'

@Component({
  selector: 'seed-organizations-column-geocoding-taxlots',
  templateUrl: './geocoding2.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, CdkDropList, CdkDrag, MatButtonModule, MatIcon, MatSelectModule, MatTooltip, ReactiveFormsModule],
})
export class GeocodingTaxlotsComponent extends GeocodingComponent implements OnInit {
  type = 'TaxLotState'

  ngOnInit(): void {
    this._columnService.taxLotColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
      this.columns = columns.sort((a, b) => a.geocoding_order - b.geocoding_order).filter((c) => c.geocoding_order != 0)
      this.availableColumns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name)).filter((c) => c.geocoding_order === 0)
    })
  }
}
