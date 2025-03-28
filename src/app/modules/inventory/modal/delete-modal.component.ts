import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { Subject, takeUntil, tap } from 'rxjs'
import { InventoryService } from '@seed/api/inventory'

@Component({
  selector: 'seed-inventory-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [MatButtonModule, MatDialogModule],
})
export class DeleteModalComponent implements OnDestroy {
  private _inventoryService = inject(InventoryService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  data = inject(MAT_DIALOG_DATA) as { viewIds: number[]; orgId: number }
  errorMessage = false

  onSubmit() {
    this._inventoryService.deletePropertyStates({ orgId: this.data.orgId, viewIds: this.data.viewIds })
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.close()
        }),
      )
      .subscribe()
  }

  close() {
    this._dialogRef.close()
  }

  dismiss() {
    console.log('dismiss')
    this._dialogRef.close()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
