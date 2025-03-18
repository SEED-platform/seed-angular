import { A11yModule } from '@angular/cdk/a11y'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import type { ValidationErrors, ValidatorFn } from '@angular/forms'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { finalize } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import type { CreateInstanceData } from '..'

@Component({
  selector: 'seed-create-instance-dialog',
  templateUrl: './create-instance-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    A11yModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
})
export class CreateInstanceDialogComponent {
  private _data = inject(MAT_DIALOG_DATA) as CreateInstanceData
  private _dialogRef = inject(MatDialogRef<CreateInstanceDialogComponent>)
  private _organizationService = inject(OrganizationService)

  private _siblingInstanceNames = new Set(this._data.parentInstance.children?.map(({ name }) => name) ?? [])
  breadcrumbs: string[] = []
  nameValidator = new FormControl('', [this._siblingNameValidator()])
  submitted = false

  constructor() {
    this.nameValidator.markAsTouched()
    this._getBreadcrumbs()
  }

  isValid(name: string) {
    return name.trim().length > 0 && !this._siblingInstanceNames.has(name.trim())
  }

  create(name: string) {
    if (!this.submitted && this.isValid(name)) {
      this.submitted = true
      this._organizationService
        .createAccessLevelInstance(this._data.organizationId, this._data.parentInstance.id, name.trim())
        .pipe(
          finalize(() => {
            this._dialogRef.close(true)
          }),
        )
        .subscribe()
    } else {
      this._dialogRef.close(false)
    }
  }

  private _siblingNameValidator(): ValidatorFn {
    return (control: FormControl<string>): ValidationErrors | null => {
      const forbidden = this._siblingInstanceNames.has(control.value.trim())
      return forbidden ? { siblingName: { value: control.value.trim() } } : null
    }
  }

  private _getBreadcrumbs() {
    // Find parent to get sibling names
    const breadcrumbs: string[] = []
    for (const name of this._data.accessLevelNames) {
      if (name in this._data.parentInstance.path) {
        breadcrumbs.push(this._data.parentInstance.path[name])
      } else {
        break
      }
    }
    this.breadcrumbs = breadcrumbs
  }
}
