import { inject } from '@angular/core'
import type { CanActivateChildFn, CanActivateFn } from '@angular/router'
import { Router } from '@angular/router'
import { of, switchMap } from 'rxjs'
import { AuthService } from 'app/core/auth/auth.service'

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
  const router: Router = inject(Router)

  // Check the authentication status
  return inject(AuthService)
    .check()
    .pipe(
      switchMap((authenticated) => {
        // If the user is not authenticated...
        if (!authenticated) {
          // Redirect to the sign-in page with a redirectUrl param
          const redirectURL = state.url === '/sign-out' ? '' : `?redirectURL=${state.url}`
          const urlTree = router.parseUrl(`sign-in${redirectURL}`)

          return of(urlTree)
        }

        // Allow the access
        return of(true)
      }),
    )
}
