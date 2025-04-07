import { CommonModule } from '@angular/common'
import { Component, Input, type OnInit } from '@angular/core'
import { forwardRef } from '@angular/core'
import { type FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms'
import { MatAutocompleteModule } from '@angular/material/autocomplete'
import { MatInputModule } from '@angular/material/input'
import { map, type Observable, startWith } from 'rxjs'
import { type Column } from '@seed/api/column'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-header-autocomplete',
  templateUrl: './seed-header-autocomplete.component.html',
  imports: [CommonModule, SharedImports, MatAutocompleteModule, MatInputModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SeedHeaderAutocompleteComponent),
      multi: true,
    },
  ],
})
export class SeedHeaderAutocompleteComponent implements OnInit {
  @Input() formControl: FormControl
  @Input() columns: Column[]
  @Input() label: string
  filteredColumns: Observable<Column[]>

  ngOnInit() {
    console.log(this.formControl)
    this.filteredColumns = this.formControl.valueChanges.pipe(
      startWith(''),
      map((val: string) => this.filter(val)),
    )
  }

  filter(val: string) {
    return this.columns.filter((col) => col.column_name.toLocaleLowerCase().includes(val.toLocaleLowerCase()))
  }
  displayFn = (a: string) => {
    if (this.columns) {
      const col = this.columns.find((c) => c.column_name === a)
      if (col) {
        return col.display_name
      } else {
        return a
      }
    } else {
      return a
    }
  }

  registerOnChange(fn: () => void) {
    this.formControl.registerOnChange(fn)
  }

  registerOnTouched(fn: () => void) {
    fn()
  }

  writeValue(value) {
    this.formControl.setValue(value)
  }
}
