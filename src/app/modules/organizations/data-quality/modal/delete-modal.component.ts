import type { OnDestroy } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { Subject, takeUntil, tap } from 'rxjs'
import { DataQualityService, type Rule } from '@seed/api/data-quality'

@Component({
  selector: 'seed-cycles-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [MatButtonModule, MatDialogModule],
})
export class DeleteModalComponent implements OnDestroy {
  private _dataQualityService = inject(DataQualityService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  private readonly _unsubscribeAll$ = new Subject<void>()

  data = inject(MAT_DIALOG_DATA) as { rule: Rule; orgId: number; displayName: string }

  dismiss() {
    this._dialogRef.close()
  }
  close() {
    this._dialogRef.close()
  }

  onSubmit() {
    this._dataQualityService
      .deleteRule({ id: this.data.rule.id, orgId: this.data.orgId })
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => {
          this.close()
        }),
      )
      .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
