import type { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { throwError } from 'rxjs'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private _snackBar = inject(SnackBarService)

  handleError(error: HttpErrorResponse, defaultMessage: string) {
    let errorMessage = ''
    if ((error.error as { message: string })?.message) {
      errorMessage = (error.error as { message: string })?.message
    } else if (this.isObjOfArrayStrings(error.error)) {
      // format if error is an object of string[]
      // e.g. { x: ['y', 'z']} => 'x: y, z'
      errorMessage = Object.entries(error.error)
        .map(([key, value]) => `${key}: ${value.join(', ')}`)
        .join(' ')
    } else {
      errorMessage = defaultMessage
    }
    this._snackBar.alert(errorMessage)
    return throwError(() => new Error(error?.message || defaultMessage))
  }

  isObjOfArrayStrings(obj: unknown): obj is Record<string, string[]> {
    return (
      typeof obj === 'object'
      && obj !== null
      && Object.values(obj).every((value) => Array.isArray(value) && value.every((item) => typeof item === 'string'))
    )
  }
}
