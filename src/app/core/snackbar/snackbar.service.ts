import { inject, Injectable } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private _snackBar = inject(MatSnackBar)

  alert(message: string, button = 'OK') {
    this._snackBar.open(message, button, { panelClass: 'soft-alert-snackbar', horizontalPosition: 'center', verticalPosition: 'top' })
  }

  warning(message: string, button = 'OK') {
    this._snackBar.open(message, button, { panelClass: 'soft-alert-snackbar', horizontalPosition: 'center', verticalPosition: 'top' })
  }

  success(message: string, button = 'OK') {
    this._snackBar.open(message, button, { panelClass: 'soft-success-snackbar', horizontalPosition: 'center', verticalPosition: 'top' })
  }

  info(message: string, button = 'OK') {
    this._snackBar.open(message, button, { panelClass: 'soft-info-snackbar', horizontalPosition: 'center', verticalPosition: 'top' })
  }
}
