import type { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http'
import { HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import type { Observable } from 'rxjs'
import { catchError, throwError } from 'rxjs'
import { AuthService } from './auth.service'
import { AuthUtils } from './auth.utils'

const currentPath = (router: Router) => {
  const urlTree = router.parseUrl(router.url)
  const primarySegments = urlTree.root.children.primary?.segments ?? []
  return primarySegments.map((segment) => segment.toString()).join('/')
}

export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService)
  const router = inject(Router)

  // If the access token didn't expire, add the Authorization header to api requests.
  // We won't add the Authorization header if the access token expired, which forces a 401 response from Django.
  // The response interceptor will catch and delete the access token from local storage while signing out the user.
  const addToken = /^\/?api\//.test(req.url) && authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)
  const newReq = req.clone({
    headers: addToken ? req.headers.set('Authorization', `Bearer ${authService.accessToken}`) : undefined,
  })

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

      return throwError(() => new Error(`Failed to request ${req.method} ${req.url}`))
    }),
  )
}
