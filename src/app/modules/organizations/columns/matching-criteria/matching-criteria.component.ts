import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { Subject } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { SharedImports } from '@seed/directives'

type ColumnChangeSet = {
  is_excluded_from_hash: boolean;
  recognize_empty: boolean;
  merge_protection?: 0 | 1;
}
@Component({
  selector: 'seed-organizations-column-matching-criteria',
  template: '',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class MatchingCriteriaComponent implements OnDestroy {
  protected _columnService = inject(ColumnService)
  protected _organizationService = inject(OrganizationService)
  protected readonly _unsubscribeAll$ = new Subject<void>()
  private _dialog = inject(MatDialog)
  private _router = inject(Router)
  columns: Column[]
  availableColumns: Column[]
  originalMatchingColumns: Column[]
  matchingColumns: Column[]
  organization: Organization
  addedColumns: Column[]
  addForm = new FormGroup({
    columnToAdd: new FormControl<number>(null, [Validators.required]),
  })

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  populateMatchingColumns() {
    this.matchingColumns = this.columns.filter((c) => c.is_matching_criteria)
    this.availableColumns = this.columns.filter((c) => !this.matchingColumns.map((c) => c.id).includes(c.id) && !c.is_extra_data)
  }

  canRemove(column: Column) {
    return !column.is_matching_criteria
  }

  remove(column: Column) {
    console.log('Removing: ', column)
  }

  addColumn() {
    const col = this.columns.find((c) => c.id === this.addForm.get('columnToAdd').value)
    console.log("Adding ", col)
  }
}
