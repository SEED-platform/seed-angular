import { inject } from '@angular/core'
import type { CanActivateChildFn, CanActivateFn } from '@angular/router'
import { Router } from '@angular/router'
import { of, switchMap } from 'rxjs'
import { AuthService } from 'app/core/auth/auth.service'

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = () => {
  const router: Router = inject(Router)

  // Check the authentication status
  return inject(AuthService)
    .check()
    .pipe(
      switchMap((authenticated) => {
        // If the user is authenticated...
        if (authenticated) {
          return of(router.parseUrl(''))
        }

        // Allow the access
        return of(true)
      }),
    )
}
