import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { OrganizationService, type OrganizationUser } from '@seed/api/organization'
import { AlertComponent } from '@seed/components'

@Component({
  selector: 'seed-member-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [
    AlertComponent,
    CommonModule,
    MatButtonModule,
    MatDialogModule,
  ],
})
export class DeleteModalComponent {
  private _organizationService = inject(OrganizationService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  errorMessage: string

  data = inject(MAT_DIALOG_DATA) as { member: OrganizationUser; orgId: number }

  onSubmit() {
    this._organizationService.deleteOrganizationUser(this.data.member.user_id, this.data.orgId).subscribe({
      next: () => { this.close('success') },
      error: (error: string) => { this.errorMessage = error },
    })
  }

  close(message: string) {
    this._dialogRef.close(message)
  }

  dismiss() {
    this._dialogRef.close()
  }
}
