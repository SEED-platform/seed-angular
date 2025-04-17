import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import type { EmailTemplate } from '@seed/api/postoffice'
import { PostOfficeService } from '@seed/api/postoffice'

@Component({
  selector: 'seed-labels-delete-modal',
  templateUrl: './delete-modal.component.html',
  imports: [MatButtonModule, MatDialogModule],
})
export class DeleteModalComponent implements OnInit {
  private _postOfficeService = inject(PostOfficeService)
  private _dialogRef = inject(MatDialogRef<DeleteModalComponent>)
  data = inject(MAT_DIALOG_DATA) as { template: EmailTemplate | null; organization_id: number }
  template: EmailTemplate

  ngOnInit(): void {
    this.template = this.data.template
  }

  onSubmit() {
    this._postOfficeService.delete(this.template.id, this.data.organization_id).subscribe()
    this.close()
  }

  close() {
    this._dialogRef.close()
  }
}
