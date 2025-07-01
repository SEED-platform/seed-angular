import type { AfterViewInit, ElementRef } from '@angular/core'
import { Component, ViewChild } from '@angular/core'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import type { ICellEditorAngularComp } from 'ag-grid-angular'
import type { ICellEditorParams } from 'ag-grid-community'
import { isOrderedSubset } from '@seed/utils/string-matching.util'

@Component({
  selector: 'seed-ag-grid-auto-complete-cell',
  templateUrl: './autocomplete.component.html',
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})
export class AutocompleteCellComponent implements ICellEditorAngularComp, AfterViewInit {
  @ViewChild('input') input!: ElementRef<HTMLInputElement>
  inputCtrl = new FormControl('')
  filteredOptions: string[] = []

  params!: unknown
  options: string[] = []

  agInit(params: ICellEditorParams): void {
    this.params = params
    this.options = ((params as unknown) as { values: string[] }).values || []
    this.inputCtrl.setValue(params.value as string)
    this.filteredOptions = [...this.options]
    this.inputCtrl.valueChanges.subscribe((value) => {
      // autocomplete
      this.filteredOptions = this.options.filter((option) => {
        return isOrderedSubset(value, option)
      })
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

  onKeyDown(event: KeyboardEvent) {
    // if enter, accept the value and stop propagation
    const exitKeys = ['Enter']
    if (!exitKeys.includes(event.key)) {
      event.stopPropagation()
    }
  }
}
