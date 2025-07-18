import type { AfterViewInit, ElementRef } from '@angular/core'
import { Component, ViewChild } from '@angular/core'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import type { ICellEditorAngularComp } from 'ag-grid-angular'
import type { ICellEditorParams } from 'ag-grid-community'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-ag-grid-auto-complete-cell',
  templateUrl: './autocomplete.component.html',
  imports: [
    FormsModule,
    MaterialImports,
    ReactiveFormsModule,
  ],
})
export class AutocompleteCellComponent implements ICellEditorAngularComp, AfterViewInit {
  @ViewChild('input') input!: ElementRef<HTMLInputElement>
  inputCtrl = new FormControl('')
  filteredOptions: string[] = []

  params!: ICellEditorParams & { values?: string[] }
  options: string[] = []

  agInit(params: ICellEditorParams & { values?: string[] }): void {
    this.params = params
    this.options = params.values || []
    this.inputCtrl.setValue(params.value as string)
    this.filteredOptions = [...this.options]
    this.inputCtrl.valueChanges.subscribe((value) => {
      // autocomplete
      this.filteredOptions = this.options.filter((option) => {
        return option.toLowerCase().startsWith(value.toLowerCase())
      })
      // update after each keystroke
      this.params.node.setDataValue(this.params.column.getId(), value)
    })
  }

  getValue() {
    return this.inputCtrl.value
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.input.nativeElement.focus()
    })
  }
}
