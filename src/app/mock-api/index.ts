import { inject, Injectable } from '@angular/core'
import { AuthMockApi } from 'app/mock-api/common/auth/api'
import { NavigationMockApi } from 'app/mock-api/common/navigation/api'
import { UserMockApi } from 'app/mock-api/common/user/api'
import { IconsMockApi } from 'app/mock-api/ui/icons/api'

@Injectable({ providedIn: 'root' })
export class MockApiService {
  authMockApi = inject(AuthMockApi)
  iconsMockApi = inject(IconsMockApi)
  navigationMockApi = inject(NavigationMockApi)
  userMockApi = inject(UserMockApi)
}
