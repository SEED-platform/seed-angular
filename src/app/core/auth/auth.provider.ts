import { provideHttpClient, withInterceptors } from '@angular/common/http'
import type { EnvironmentProviders, Provider } from '@angular/core'
import { inject, provideEnvironmentInitializer } from '@angular/core'
import { authInterceptor } from 'app/core/auth/auth.interceptor'
import { AuthService } from 'app/core/auth/auth.service'

export const provideAuth = (): (Provider | EnvironmentProviders)[] => {
  return [provideHttpClient(withInterceptors([authInterceptor])), provideEnvironmentInitializer(() => inject(AuthService))]
}
