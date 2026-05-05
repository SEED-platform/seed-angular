import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http'
import type { EnvironmentProviders, Provider } from '@angular/core'
import { inject, provideEnvironmentInitializer } from '@angular/core'
import { authInterceptor } from 'app/core/auth/auth.interceptor'
import { AuthService } from 'app/core/auth/auth.service'

export const provideAuth = (): (Provider | EnvironmentProviders)[] => {
  return [
    provideHttpClient(withInterceptors([authInterceptor]), withXsrfConfiguration({ cookieName: 'csrftoken', headerName: 'X-CSRFToken' })),
    provideEnvironmentInitializer(() => inject(AuthService)),
  ]
}
