import { inject } from '@angular/core'
import { forkJoin } from 'rxjs'
// import { DatasetService } from '@seed/api/dataset'
import { VersionService } from '@seed/api/version/version.service'
import { NavigationService } from 'app/core/navigation/navigation.service'

export const initialDataResolver = () => {
  // const datasetService = inject(DatasetService)
  const navigationService = inject(NavigationService)
  const versionService = inject(VersionService)

  // Fork join multiple API endpoint calls to wait all of them to finish
  return forkJoin([
    versionService.get(),
    // datasetService.countDatasets(),
    navigationService.get(),
  ])
}
