import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { OrganizationService } from '@seed/api/organization'

@Component({
  selector: 'seed-upload-instances-dialog',
  templateUrl: './upload-instances-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
})
export class UploadInstancesDialogComponent {
  private _dialogRef = inject(MatDialogRef<UploadInstancesDialogComponent>)
  private _organizationService = inject(OrganizationService)

  readonly allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  file?: File
  submitted = false

  upload() {
    // TODO
  }

  selectFile(fileList: FileList): Promise<void> {
    if (fileList.length === 0) {
      return
    }

    const [file] = fileList

    if (!this.allowedTypes.includes(file.type)) {
      return
    }

    this.file = file
  }

  isExcelFile() {
    return /\.xlsx?$/.test(this.file?.name)
  }
}
