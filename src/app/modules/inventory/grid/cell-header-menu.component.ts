import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import type { IHeaderAngularComp } from 'ag-grid-angular'
import type { IHeaderParams } from 'ag-grid-community'

@Component({
  selector: 'seed-inventory-grid-cell-header-menu',
  templateUrl: './cell-header-menu.component.html',
  imports: [
    MatIconModule,
  ],
})
export class CellHeaderMenuComponent implements IHeaderAngularComp {
  public params: IHeaderParams
  public menuVisible = false

  agInit(params: IHeaderParams): void {
    this.params = params
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation()
    this.menuVisible = !this.menuVisible
  }

  sortAsc(): void {
    console.log('sort asc')
    // this.params.columnApi.applyColumnState({
    //   state: [{ colId: this.params.column.getId(), sort: 'asc' }],
    //   applyOrder: true,
    // })
    this.menuVisible = false
  }

  refresh() {
    return true
  }
}
