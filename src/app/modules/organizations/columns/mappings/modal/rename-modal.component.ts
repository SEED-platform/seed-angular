import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { type ColumnMappingProfile, ColumnMappingProfileService } from '@seed/api/column-mapping-profile'

@Component({
  selector: 'seed-column-mappings-rename-modal',
  templateUrl: './rename-modal.component.html',
  imports: [MatButtonModule, MatDialogModule, MatDividerModule, MatFormFieldModule, MatIconModule, MatInputModule, ReactiveFormsModule],
})
export class RenameModalComponent implements OnInit {
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _dialogRef = inject(MatDialogRef<RenameModalComponent>)
  errorMessage: string
  inProgress = false
  profile: ColumnMappingProfile
  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
  })
  data = inject(MAT_DIALOG_DATA) as { profile: ColumnMappingProfile; org_id: number }

  ngOnInit(): void {
    this.profile = this.data.profile
    this.form.get('name').setValue(this.profile.name)
  }

  onSubmit() {
    this.profile.name = this.form.get('name').value
    this._columnMappingProfileService.update(this.data.org_id, this.profile).subscribe(() => {
      this.close()
    })
  }

  close() {
    this._dialogRef.close()
  }
}
