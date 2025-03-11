import { Component, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { Subject } from 'rxjs'
import { type Column, type ColumnService } from '@seed/api/column'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-organizations-column-import-settings',
  templateUrl: './import-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ImportSettingsComponent implements OnDestroy{
  protected _columnService: ColumnService
  protected readonly _unsubscribeAll$ = new Subject<void>()
  columns: Column[]

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  save(): void {
    
  }

}
