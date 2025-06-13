import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { Subject } from 'rxjs'

@Component({
  selector: 'seed-inventory-more-actions-modal',
  templateUrl: './more-actions-modal.component.html',
  imports: [MatButtonModule, MatDialogModule],
})
export class MoreActionsModalComponent implements OnDestroy {
  private _dialogRef = inject(MatDialogRef<MoreActionsModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  data = inject(MAT_DIALOG_DATA) as { viewIds: number[]; orgId: number }
  errorMessage = false

  actionsColumn1 = [
    { name: 'Add / Remove Groups', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Add / Remove Labels', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Add / Update UBID', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Change ALI', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Compare UBID', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Data Quality Check', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Decode UBID', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Delete', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Email', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Export', action: this.tempAction, disabled: !this.data.viewIds.length },

  ]
  actionsColumn2 = [
    { name: 'Export to AT', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'FEMP CTS Reporting Export', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Geocode', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Merge', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Run Analysis', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Set Update Time to Now', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Update Derived Data', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Update Salesforce', action: this.tempAction, disabled: !this.data.viewIds.length },
    { name: 'Update with AT', action: this.tempAction, disabled: !this.data.viewIds.length },
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
