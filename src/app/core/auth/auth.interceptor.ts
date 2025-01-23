import type { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http'
import { HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import type { Observable } from 'rxjs'
import { catchError, throwError } from 'rxjs'
import { AuthService } from 'app/core/auth/auth.service'
import { AuthUtils } from 'app/core/auth/auth.utils'

const currentPath = (router: Router) => {
  const urlTree = router.parseUrl(router.url)
  const primarySegments = urlTree.root.children.primary?.segments ?? []
  return primarySegments.map((segment) => segment.toString()).join('/')
}

export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService)
  const router = inject(Router)

  let newReq: HttpRequest<unknown>

  // If the access token didn't expire, add the Authorization header to api requests.
  // We won't add the Authorization header if the access token expired, which forces a 401 response from Django.
  // The response interceptor will catch and delete the access token from local storage while signing out the user.
  if (/^\/?api\//.test(req.url) && authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)) {
    newReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${authService.accessToken}`),
    })
  } else {
    newReq = req.clone()
  }

  // Response
  return next(newReq).pipe(
    catchError((error) => {
      // Handle "401 Unauthorized" responses (except on sign-in page)
      if (error instanceof HttpErrorResponse && error.status === 401 && currentPath(router) !== 'sign-in') {
        // Sign out
        authService.signOut()

        // Reload the app
        location.reload()
      }

      return throwError(() => new Error('An unexpected error occurred.'))
    }),
  )
}
