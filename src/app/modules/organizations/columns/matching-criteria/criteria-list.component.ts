import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { type Column } from '@seed/api/column'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-matching-criteria-list',
  templateUrl: './criteria-list.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, MatButtonModule, MatIcon],
})

export class CriteriaListComponent {
  @Input() columns: Column[]
  @Output() removeColumnEvent = new EventEmitter<Column>()

  removeColumn(column: Column) {
    this.removeColumnEvent.emit(column)
  }

  canRemove(column: Column) {
    return !column.is_matching_criteria
  }
}
