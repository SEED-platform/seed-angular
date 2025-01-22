import { HttpClient, HttpHeaders } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Router } from '@angular/router'
import type { Observable } from 'rxjs'
import { catchError, of, switchMap, throwError } from 'rxjs'
import { AuthUtils } from 'app/core/auth/auth.utils'
import { UserService } from 'app/core/user/user.service'

type TokenResponse = {
  access: string;
  refresh: string;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _router = inject(Router)

  private _authenticated = false
  private _httpClient = inject(HttpClient)
  private _userService = inject(UserService)

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

  /**
   * Forgot password
   *
   * @param email
   */
  forgotPassword(email: string): Observable<any> {
    return this._httpClient.post('api/auth/forgot-password', email)
  }

  resetPassword(password: string): Observable<any> {
    return this._httpClient.post('api/auth/reset-password', password)
  }

  signIn(credentials: { email: string; password: string }): Observable<any> {
    // Throw error, if the user is already logged in
    if (this._authenticated) {
      return throwError(() => new Error('User is already logged in.'))
    }

    return this._httpClient.post(`/api/token/`, credentials).pipe(
      switchMap((response: any) => {
        this.handleTokenResponse(response as TokenResponse);
        return of(response)
      }),
    )
  }

  refreshAccessToken(): Observable<any> {
    return this._httpClient.post(`/api/token/refresh/`, { refresh: this.refreshToken }).pipe(
      switchMap((response: any) => {
        this.handleTokenResponse(response as TokenResponse);
        return of(response)
      })
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

  /**
   * Sign out
   */
  signOut(): Observable<any> {
    // Remove the access token from the local storage
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')

    // Set the authenticated flag to false
    this._authenticated = false
    void this._router.navigate(['sign-in'])

    // Return the observable
    return of(true)
  }

  /**
   * Sign up
   *
   * @param user
   */
  signUp(user: { name: string; email: string; password: string; company: string }): Observable<any> {
    return this._httpClient.post('api/auth/sign-up', user)
  }

  /**
   * Check the authentication status
   */
  check(): Observable<boolean> {
    // Check if the user is logged in
    if (this._authenticated && !AuthUtils.isTokenExpired(this.accessToken)) {
      return of(true)
    }

    // Check the access token availability
    if (!this.accessToken) {
      return of(false)
    }

    if (!this._authenticated && this.accessToken && !AuthUtils.isTokenExpired(this.accessToken)) {
      this.handleTokenResponse({ access: this.accessToken, refresh: this.refreshToken } as TokenResponse)
      return of(true)
    }

    // Check the access token expire date
    if (AuthUtils.isTokenExpired(this.accessToken) && AuthUtils.isTokenExpired(this.refreshToken)) {
      return of(false)
    }

    if (AuthUtils.isTokenExpired(this.accessToken)) {
      return this.refreshAccessToken();
    }
  }
}
