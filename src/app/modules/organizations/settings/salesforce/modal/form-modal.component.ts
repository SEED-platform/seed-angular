import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { Subject, takeUntil } from 'rxjs'
import type { Column } from '@seed/api/column'
import { ColumnService } from '@seed/api/column'
import type { SalesforceMapping } from '@seed/api/salesforce'
import { SalesforceService } from '@seed/api/salesforce'
import { naturalSort } from '@seed/utils'

@Component({
  selector: 'seed-salesforce-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule],
})
export class FormModalComponent implements OnDestroy, OnInit {
  private _columnService = inject(ColumnService)
  private _salesforceService = inject(SalesforceService)
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()
  columns: Column[]

  create = true
  data = inject(MAT_DIALOG_DATA) as {
    salesforceMapping: SalesforceMapping | null;
    organization_id: number;
    column: number;
    salesforce_fieldname: string;
  }
  form = new FormGroup({
    salesforce_fieldname: new FormControl<string | null>('', [Validators.required]),
    column: new FormControl<number | null>(null, [Validators.required]),
    organization_id: new FormControl<number | null>(null),
    id: new FormControl<number | null>(null),
  })

  ngOnInit(): void {
    this._columnService.propertyColumns$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((columns) => {
      this.columns = columns.sort((a, b) => naturalSort(a.display_name, b.display_name))
    })
    if (this.data.salesforceMapping) {
      this.create = false
      this.form.patchValue(this.data.salesforceMapping)
    } else {
      this.form.get('organization_id').setValue(this.data.organization_id)
    }
  }

  onSubmit() {
    const data = this.form.value as SalesforceMapping
    if (data.id) {
      this._salesforceService.updateMapping(data.organization_id, data).subscribe()
    } else {
      this._salesforceService.createMapping(data.organization_id, data).subscribe()
    }
    this.close()
  }

  close() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
