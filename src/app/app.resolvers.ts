import { inject } from '@angular/core'
import { forkJoin } from 'rxjs'
import { VersionService } from '@seed/api/version/version.service'

export const initialDataResolver = () => {
  const versionService = inject(VersionService)

  // Fork join multiple API endpoint calls to wait on all of them to finish
  return forkJoin([versionService.get()])
}
