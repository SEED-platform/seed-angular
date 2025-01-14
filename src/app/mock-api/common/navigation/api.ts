import { inject, Injectable } from '@angular/core'
import type { NavigationItem } from '@seed/components'
import { MockApiService } from '@seed/mock-api'
import { defaultNavigation } from 'app/mock-api/common/navigation/data'

@Injectable({ providedIn: 'root' })
export class NavigationMockApi {
  private _mockApiService = inject(MockApiService)

  private readonly _defaultNavigation: NavigationItem[] = defaultNavigation

  constructor() {
    // Register Mock API handlers
    this.registerHandlers()
  }

  /**
   * Register Mock API handlers
   */
  registerHandlers(): void {
    // -----------------------------------------------------------------------------------------------------
    // @ Navigation - GET
    // -----------------------------------------------------------------------------------------------------
    this._mockApiService.onGet('api/common/navigation').reply(() => {
      // Return the response
      return [
        200,
        {
          default: structuredClone(this._defaultNavigation),
        },
      ]
    })
  }
}
