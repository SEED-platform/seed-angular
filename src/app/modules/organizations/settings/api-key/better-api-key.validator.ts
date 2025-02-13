import { inject, Injectable } from '@angular/core'
import { type AbstractControl, type AsyncValidator, type ValidationErrors } from '@angular/forms'
import { catchError, map, type Observable, of } from 'rxjs'
import { BetterService } from '@seed/services/better/better.service'

@Injectable({ providedIn: 'root' })
export class BetterApiKeyValidator implements AsyncValidator {
  private _betterService = inject(BetterService)

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    if (control.value === undefined || control.value === '') {
      return of(null)
    }

    return this._betterService.verifyBetterToken(control.value as string).pipe(
      map((isValid) => (isValid ? null : { invalid_token: true })),
      catchError(() => of(null)),
    )
  }
}
