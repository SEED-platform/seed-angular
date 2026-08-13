import { Component } from '@angular/core'
import type { IHeaderAngularComp } from 'ag-grid-angular'
import type { IHeaderParams } from 'ag-grid-community'

type LabelGridContext = {
  labelsExpanded: boolean;
  toggleLabels: () => void;
}

@Component({
  selector: 'seed-inventory-label-header',
  template: `
    <div class="flex w-full cursor-pointer items-center gap-2 overflow-hidden" (click)="toggle()">
      <span class="material-icons-outlined" style="font-size:14px;line-height:1;">{{ expanded ? 'chevron_left' : 'chevron_right' }}</span>
      @if (expanded) {
        <span class="my-auto truncate">{{ displayName }}</span>
      }
    </div>
  `,
  standalone: true,
})
export class InventoryLabelHeaderComponent implements IHeaderAngularComp {
  displayName = ''
  expanded = false

  private _params!: IHeaderParams<unknown, LabelGridContext>

  agInit(params: IHeaderParams<unknown, LabelGridContext>): void {
    this._params = params
    this.displayName = params.displayName
    this.expanded = params.context?.labelsExpanded ?? false
  }

  refresh(params: IHeaderParams<unknown, LabelGridContext>): boolean {
    this._params = params
    this.expanded = params.context?.labelsExpanded ?? false
    return true
  }

  toggle(): void {
    this._params.context?.toggleLabels()
    this.expanded = this._params.context?.labelsExpanded ?? false
  }
}
