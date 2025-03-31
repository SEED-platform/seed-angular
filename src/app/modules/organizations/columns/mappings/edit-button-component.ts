import { ChangeDetectionStrategy, Component } from '@angular/core'
import type { ColumnMapping } from '@seed/api/column_mapping_profile'
import type { ICellRendererAngularComp } from 'ag-grid-angular'
import type { ICellRendererParams, IRowNode } from 'ag-grid-community'

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<button (click)="buttonClicked($event)">Edit</button>',
})
export class EditButtonComponent implements ICellRendererAngularComp {
  data: ColumnMapping
  params: ICellRendererParams & { onClick: (mapping: ColumnMapping, node: IRowNode) => void }

  agInit(params: ICellRendererParams & { onClick: (mapping: ColumnMapping) => void }): void {
    this.params = params
    this.data = params.data as ColumnMapping
  }
  refresh(_params: ICellRendererParams) {
    return true
  }

  buttonClicked(_$event) {
    console.log("Edit clicked: ", this.params)
    this.params.onClick(this.data, this.params.node)
  }
}
