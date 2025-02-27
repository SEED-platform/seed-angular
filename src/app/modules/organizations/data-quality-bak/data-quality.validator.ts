import { Injectable } from '@angular/core'
import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms'
import type { Rule } from '@seed/api/data-quality/data-quality.types'

@Injectable({ providedIn: 'root' })
export class DataQualityValidator {
  dataTypeMatch(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parentControl = control.parent
      if (!parentControl?.parent) return

      setTimeout(() => {
        const rule = parentControl.value as Rule
        const rules = parentControl.parent.value as Rule[]
        const matchingFieldRows = rules.filter((r: Rule) => r.field === rule.field)

        if (!matchingFieldRows.every((r: Rule) => r.data_type === rule.data_type)) {
          console.log('we got an error')
          control.setErrors({ dataTypeMatch: true })
        } else {
          control.setErrors(null)
        }
      })
      return null
    }
  }
}
