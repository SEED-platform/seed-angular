import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import type { SalesforceMapping } from '@seed/api/salesforce'
import { SalesforceService } from '@seed/api/salesforce'

@Component({
  selector: 'seed-salesforce-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [MatButtonModule, MatDialogModule],
})
export class DeleteModalComponent implements OnInit {
  private _salesforceService = inject(SalesforceService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  columnName: string

  create = true
  data = inject(MAT_DIALOG_DATA) as { salesforceMapping: SalesforceMapping | null; columnName: string }
  salesforceMapping: SalesforceMapping

  ngOnInit(): void {
    this.salesforceMapping = this.data.salesforceMapping
    this.columnName = this.data.columnName
  }

  onSubmit() {
    this._salesforceService.deleteMapping(this.salesforceMapping).subscribe()
    this.close()
  }

  close() {
    this._dialogRef.close()
  }
}
