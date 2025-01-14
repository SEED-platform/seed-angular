import { inject } from '@angular/core'
import { forkJoin } from 'rxjs'
import { NavigationService } from 'app/core/navigation/navigation.service'

export const initialDataResolver = () => {
  const navigationService = inject(NavigationService)

  // Fork join multiple API endpoint calls to wait all of them to finish
  return forkJoin([navigationService.get()])
}
