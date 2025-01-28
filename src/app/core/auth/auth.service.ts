import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import type { Observable } from 'rxjs'
import { map, of, tap, throwError } from 'rxjs'
import { AuthUtils } from 'app/core/auth/auth.utils'
import { UserService } from 'app/core/user/user.service'
import type { TokenResponse } from './auth.types'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _httpClient = inject(HttpClient)
  private _router = inject(Router)
  private _userService = inject(UserService)

  private _authenticated = false

  set accessToken(token: string) {
    localStorage.setItem('accessToken', token)
  }

  get accessToken(): string {
    return localStorage.getItem('accessToken') ?? ''
  }

  set refreshToken(token: string) {
    localStorage.setItem('refreshToken', token)
  }

  get refreshToken(): string {
    return localStorage.getItem('refreshToken') ?? ''
  }

  // TODO
  forgotPassword(email: string): Observable<unknown> {
    return this._httpClient.post('api/auth/forgot-password', email)
  }

  // TODO
  resetPassword(password: string): Observable<unknown> {
    return this._httpClient.post('api/auth/reset-password', password)
  }

  signIn(credentials: { username: string; password: string }): Observable<TokenResponse> {
    // Throw error if the user is already logged in
    if (this._authenticated) {
      return throwError(() => new Error('User is already logged in.'))
    }

    return this._httpClient.post<TokenResponse>('/api/token/', credentials).pipe(
      tap((response) => {
        this.handleTokenResponse(response)
      }),
    )
  }

  refreshAccessToken(): Observable<boolean> {
    // TODO check this post data
    return this._httpClient.post<TokenResponse>('/api/token/refresh/', { refresh: this.refreshToken }).pipe(
      map((response) => {
        this.handleTokenResponse(response)
        return true
      }),
    )
  }

  handleTokenResponse(response: TokenResponse) {
    this.accessToken = response.access
    this.refreshToken = response.refresh

    // Set the authenticated flag to true
    this._authenticated = true

    // Store the user on the user service
    this._userService.user = AuthUtils.tokenUser(this.accessToken)
  }

  signOut(): Observable<boolean> {
    // Remove the access token from the local storage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    // Set the authenticated flag to false
    this._authenticated = false
    void this._router.navigate(['sign-in'])

    return of(true)
  }

  // TODO
  signUp(user: { name: string; email: string; password: string; company: string }): Observable<unknown> {
    return this._httpClient.post('api/auth/sign-up', user)
  }

  isAuthenticated(): Observable<boolean> {
    // Check if the user is logged in
    if (this._authenticated && !AuthUtils.isTokenExpired(this.accessToken)) {
      return of(true)
    }

    // Check the access token availability
    if (!this.accessToken) {
      return of(false)
    }

    if (!this._authenticated && !AuthUtils.isTokenExpired(this.accessToken)) {
      this.handleTokenResponse({
        access: this.accessToken,
        refresh: this.refreshToken,
      })
      return of(true)
    }

    // Check the token expirations
    if (AuthUtils.isTokenExpired(this.accessToken)) {
      if (AuthUtils.isTokenExpired(this.refreshToken)) {
        return of(false)
      }

      return this.refreshAccessToken()
    }
  }
}
