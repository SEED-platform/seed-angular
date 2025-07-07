import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { Subject } from 'rxjs'

@Component({
  selector: 'seed-inventory-more-actions-modal',
  templateUrl: './more-actions-modal.component.html',
  imports: [MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule],
})
export class MoreActionsModalComponent implements OnDestroy {
  private _dialogRef = inject(MatDialogRef<MoreActionsModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  data = inject(MAT_DIALOG_DATA) as { viewIds: number[]; orgId: number }
  errorMessage = false

  actionsColumn1 = [
    { name: 'Analysis: Run', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Audit Template: Export', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Audit Template: Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Change Access Level', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Data Quality Check', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Delete', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Derived Data: Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Email', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Export', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'FEMP CTS Reporting Export', action: this.tempAction, disabled: !this.data.viewIds.length },
  ]
  actionsColumn2 = [
    { name: 'Geocode', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Groups: Add / Remove', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Labels: Add / Remove', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Merge', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Set Update Time to Now', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Salesforce: Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'UBID: Add / Update', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'UBID: Compare', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'UBID: Decode', action: this.tempAction, disabled: !this.data.viewIds.length },
  ]

  tempAction() {
    console.log('temp action')
  }

  close() {
    this._dialogRef.close()
  }

  dismiss() {
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
