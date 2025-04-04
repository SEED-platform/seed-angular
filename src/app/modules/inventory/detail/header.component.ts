import type { OnInit } from '@angular/core'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { type MatSelect, MatSelectModule } from '@angular/material/select'
import type { Label } from '@seed/api/label'
import { LabelComponent } from '@seed/components'
import type { GenericView, ViewResponse } from '../inventory.types'

@Component({
  selector: 'seed-inventory-detail-header',
  templateUrl: './header.component.html',
  imports: [
    MatSelectModule,
    LabelComponent,
  ],
})
export class HeaderComponent implements OnInit {
  @Input() labels: Label[]
  @Input() selectedView: GenericView
  @Input() view: ViewResponse
  @Input() views: GenericView[]
  @Output() changeView = new EventEmitter<number>()

  actions = [
    { name: 'Add to/Remove from Groups', action: () => { this.tempAction() }, disabled: false },
    { name: 'Add/Remove Labels', action: () => { this.tempAction() }, disabled: false },
    { name: 'Add/Update UBID', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export Audit Template File (XML)', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export BuildingSync', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export BuildingSync (Excel)', action: () => { this.tempAction() }, disabled: false },
    { name: 'Export to Audit Template', action: () => { this.tempAction() }, disabled: false },
    { name: 'Merge and Link Matches', action: () => { this.tempAction() }, disabled: false },
    { name: 'Only Show Populated Columns', action: () => { this.tempAction() }, disabled: false },
    { name: 'Run Analysis', action: () => { this.tempAction() }, disabled: false },
    { name: 'Update with Audit Template', action: () => { this.tempAction() }, disabled: false },
    { name: 'Update with BuildingSync', action: () => { this.tempAction() }, disabled: false },
    { name: 'Update with ESPM', action: () => { this.tempAction() }, disabled: false },
  ]

  ngOnInit(): void {
    console.log('init detail header')
  }

  tempAction() {
    console.log('temp action')
  }

  onAction(action: () => void, select: MatSelect) {
    action()
    select.value = null
  }

  onChangeView(viewId: number) {
    console.log('onChangeView', viewId)
    this.changeView.emit(viewId)
  }
}
