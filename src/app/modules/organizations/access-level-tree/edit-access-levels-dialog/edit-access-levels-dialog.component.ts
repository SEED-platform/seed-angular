import { NgClass } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { finalize, Subject, takeUntil } from 'rxjs'
import { OrganizationService } from '@seed/api/organization'
import { arraysEqual } from '@seed/utils'
import type { EditAccessLevelsData } from '..'

@Component({
  selector: 'seed-edit-access-levels-dialog',
  templateUrl: './edit-access-levels-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    NgClass,
    ReactiveFormsModule,
  ],
})
export class EditAccessLevelsDialogComponent implements OnInit, OnDestroy {
  private _data = inject(MAT_DIALOG_DATA) as EditAccessLevelsData
  private _dialogRef = inject(MatDialogRef<EditAccessLevelsDialogComponent>)
  private _organizationService = inject(OrganizationService)

  private readonly _unsubscribeAll$ = new Subject<void>()
  originalAccessLevels = this._data.accessLevelNames
  submitted = false
  form = new FormGroup({
    levels: new FormArray(this.originalAccessLevels.map((level) => new FormControl(level, [Validators.required]))),
  })

  get levels(): FormArray<FormControl<string>> {
    return this.form?.get('levels') as FormArray<FormControl<string>>
  }

  ngOnInit(): void {
    for (const control of this.levels.controls) {
      control.markAsTouched()
    }

    this.levels.valueChanges.pipe(takeUntil(this._unsubscribeAll$)).subscribe(() => {
      this._checkForDuplicates(this.levels)
    })
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  isValid() {
    const levels = this.levels.value.map((level) => level.trim())

    // Check for at least one level
    if (levels.length === 0) {
      return false
    }

    // Check for empty
    if (levels.some((level) => !level)) {
      return false
    }

    // Check for duplicates
    const uniqueAccessLevels = new Set(levels).size
    return levels.length === uniqueAccessLevels
  }

  addLevel(name: string) {
    const control = new FormControl(name)
    control.markAsTouched()
    this.levels.push(control)
    setTimeout(() => {
      this._checkForDuplicates(this.levels)
    })
  }

  removeLevel(index: number) {
    const levels = this.levels.value
    levels.splice(index, 1)
    this.levels.removeAt(levels.length)
    this.levels.patchValue(levels)
  }

  updateAccessLevels() {
    if (!this.submitted && this.isValid()) {
      const levels = this.levels.value.map((level) => level.trim())
      if (!arraysEqual(levels, this.originalAccessLevels)) {
        this.submitted = true
        this._organizationService
          .updateAccessLevels(this._data.organizationId, levels)
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

  private _checkForDuplicates(formArray: FormArray<FormControl<string>>): void {
    // First remove any previous duplicate errors
    for (const control of formArray.controls) {
      const otherErrors: Record<string, unknown> = {}
      for (const key in control.errors) {
        if (key !== 'duplicate') {
          otherErrors[key] = control.errors[key]
        }
      }
      control.setErrors(Object.keys(otherErrors).length ? otherErrors : null)
    }

    // Check for duplicates
    for (const control of formArray.controls) {
      const { value } = control
      if (!value) continue

      // Find all controls that have the same value.
      const duplicates = formArray.controls.filter((control) => control.value === value)

      if (duplicates.length > 1) {
        control.setErrors({ ...control.errors, duplicate: true })
      }
    }
  }
}
