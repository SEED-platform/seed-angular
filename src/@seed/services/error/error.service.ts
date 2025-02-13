import type { HttpErrorResponse } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { throwError } from 'rxjs'
import { SnackbarService } from 'app/core/snackbar/snackbar.service'

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private _snackBar = inject(SnackbarService)

  handleError(error: HttpErrorResponse, defaultMessage: string) {
    const errorMessage = (error.error as { message: string })?.message || defaultMessage
    this._snackBar.alert(errorMessage)
    return throwError(() => new Error(error?.message || defaultMessage))
  }
}
