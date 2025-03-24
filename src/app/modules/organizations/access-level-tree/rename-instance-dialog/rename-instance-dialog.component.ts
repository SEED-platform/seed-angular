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
import { SharedImports } from '@seed/directives'
import type { RenameInstanceData } from '..'

@Component({
  selector: 'seed-rename-instance-dialog',
  templateUrl: './rename-instance-dialog.component.html',
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
    SharedImports,
  ],
})
export class RenameInstanceDialogComponent {
  private _data = inject(MAT_DIALOG_DATA) as RenameInstanceData
  private _dialogRef = inject(MatDialogRef<RenameInstanceDialogComponent>)
  private _organizationService = inject(OrganizationService)

  private _siblingInstanceNames = new Set<string>()
  originalName = this._data.instance.name
  hasChildren = this._data.instance.children?.length > 0
  nameValidator = new FormControl('', [this._siblingNameValidator()])
  submitted = false

  constructor() {
    this.nameValidator.markAsTouched()
    this._findSiblingNames()
  }

  isValid(name: string) {
    return name.trim().length > 0 && !this._siblingInstanceNames.has(name.trim())
  }

  rename(name: string) {
    if (!this.submitted && this.isValid(name)) {
      if (name.trim() !== this.originalName) {
        this.submitted = true
        this._organizationService
          .editAccessLevelInstance(this._data.organizationId, this._data.instance.id, name.trim())
          .pipe(
            finalize(() => {
              this._dialogRef.close()
            }),
          )
          .subscribe()
      } else {
        this._dialogRef.close()
      }
    }
  }

  private _siblingNameValidator(): ValidatorFn {
    return (control: FormControl<string>): ValidationErrors | null => {
      const forbidden = this._siblingInstanceNames.has(control.value.trim())
      return forbidden ? { siblingName: { value: control.value.trim() } } : null
    }
  }

  private _findSiblingNames() {
    // Find parent to get sibling names
    const path: string[] = []
    for (const name of this._data.accessLevelNames) {
      if (name in this._data.instance.path) {
        path.push(this._data.instance.path[name])
      } else {
        break
      }
    }
    const parentPath = path.slice(0, -1)

    // Root instance has no parent
    if (parentPath.length > 0) {
      // Remove the root name
      parentPath.shift()
      let parent = this._data.accessLevelTree[0]

      for (const instanceName of parentPath) {
        parent = parent.children.find((child) => child.name === instanceName)
      }

      for (const { name } of parent.children) {
        if (name !== this.originalName) {
          this._siblingInstanceNames.add(name)
        }
      }
    }
  }
}
