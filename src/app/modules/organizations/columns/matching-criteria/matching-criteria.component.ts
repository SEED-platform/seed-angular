import { Component, inject, type OnDestroy, ViewEncapsulation } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
import { Subject, takeUntil, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import { type Organization, OrganizationService } from '@seed/api/organization'
import { SharedImports } from '@seed/directives'
import { naturalSort } from '@seed/utils'
import { ConfirmModalComponent } from './modal/confirm-modal.component'

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

  populateMatchingColumns(columns: Column[]) {
    this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
    this.matchingColumns = this.columns.filter((c) => c.is_matching_criteria)
    this.availableColumns = this.columns.filter((c) => !this.matchingColumns.map((c) => c.id).includes(c.id) && !c.is_extra_data)
    this.addedColumns = []
  }

  canRemove(column: Column) {
    return !column.is_matching_criteria
  }

  removeColumn($event: Column) {
    // can only remove columns that are not already set as matching criteria
    if ($event.is_matching_criteria) {
      return
    }
    this.addedColumns = this.addedColumns.filter((c) => c.id !== $event.id)
    this.availableColumns.push($event)
    this.availableColumns.sort((a, b) => naturalSort(a.display_name, b.display_name))
  }

  addColumn() {
    const col = this.columns.find((c) => c.id === this.addForm.get('columnToAdd').value)
    this.availableColumns = this.availableColumns.filter((c) => c.id !== col.id)
    this.addedColumns.push(col)
    this.addedColumns.sort((a, b) => naturalSort(a.display_name, b.display_name))
  }

  save = () => {
    const dialogRef = this._dialog.open(ConfirmModalComponent, {
      width: '40rem',
      data: { cycle: null, orgId: this.organization.id, columns: this.addedColumns },
    })

    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          if (this.columns[0].table_name === 'PropertyState') {
            this._columnService.getPropertyColumns(this.organization.id).subscribe((columns) => {
              this.populateMatchingColumns(columns)
            })
          } else if (this.columns[0].table_name === 'TaxLotState') {
            this._columnService.getTaxLotColumns(this.organization.id).subscribe((columns) => {
              this.populateMatchingColumns(columns)
            })
          }
        }),
      )
      .subscribe()
  }
}
