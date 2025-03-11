import { Component, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { Subject } from 'rxjs'
import { type Column, type ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-organizations-column-import-settings',
  templateUrl: './import-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ImportSettingsComponent implements OnDestroy {
  protected _columnService: ColumnService
  protected readonly _unsubscribeAll$ = new Subject<void>()
  columns: Column[]
  availableColumns: Column[]
  type: string

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  filterColumns(columns: Column[]) {
    this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name)).filter((c) => { c.is_excluded_from_hash || c.merge_protection || c.recognize_empty})
    this.availableColumns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name)).filter((c) => !this.columns.includes(c))   
  }
}
