import type { OnChanges, SimpleChanges } from '@angular/core'
import { Component, Input, Output } from '@angular/core'
import { EventEmitter } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatButtonModule } from '@angular/material/button'
import { MatChipsModule } from '@angular/material/chips'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import type { Label, LabelOperator } from '@seed/api/label'

@Component({
  selector: 'seed-inventory-list-map-labels',
  templateUrl: './labels.component.html',
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
  ],
})
export class LabelsComponent implements OnChanges {
  @Input() labels: Label[]
  @Input() selectedLabels: Label[]
  @Output() labelChange = new EventEmitter<{ selectedLabelIds: number[]; operator: LabelOperator }>()
  filteredLabels: Label[]
  labelInput = ''
  labelOperators: { name: string; value: LabelOperator }[] = [
    { name: 'Includes All', value: 'and' },
    { name: 'Includes Any', value: 'or' },
    { name: 'Excludes', value: 'exclude' },
  ]
  labelOperator: LabelOperator = 'and'
  colorMap = {
    blue: '#2563eb',
    gray: '#4b5563',
    green: '#059669',
    'light blue': '#0284c7',
    orange: '#ea580c',
    red: '#dc2626',
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.labels) {
      console.log('changes', changes.labels)
      this.filteredLabels = this.labels
      if (this.selectedLabels) {
        this.selectedLabels = this.selectedLabels.filter((label) => this.labels.some((l) => l.id === label.id))
      }
    }
  }

  removeLabel(label: Label) {
    if (!this.selectedLabels.includes(label)) return

    this.selectedLabels = this.selectedLabels.filter((l) => l.id !== label.id)
    this.onLabelChange()
  }

  addLabel(label: Label) {
    this.labelInput = null
    if (this.selectedLabels.includes(label)) return

    this.selectedLabels.push(label)
    label = null
    this.onLabelChange()
  }

  selectLabelOperator(operator: LabelOperator) {
    this.labelOperator = operator
    this.onLabelChange()
  }

  labelInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value
    this.filteredLabels = this.labels.filter((label) => this.isOrderedSubset(value.toLowerCase(), label.name.toLowerCase()))
  }

  onLabelChange() {
    const selectedLabelIds = this.selectedLabels.map((label) => label.id)
    this.labelChange.emit({ selectedLabelIds, operator: this.labelOperator })
  }

  // determine if a string is a subset of another string, preserving order
  // e.g. 'ac' is a subset of 'abc'
  isOrderedSubset(input: string, target: string): boolean {
    let i = 0
    for (const char of target) {
      if (char === input[i]) i++
      if (i === input.length) return true
    }
    return i === input.length
  }
}
