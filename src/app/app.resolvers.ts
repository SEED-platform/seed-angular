import { inject } from '@angular/core'
import { forkJoin } from 'rxjs'
import { ConfigService } from '@seed/api/config'
import { OrganizationService } from '@seed/api/organization/organization.service'
import { VersionService } from '@seed/api/version'
import { NavigationService } from 'app/core/navigation/navigation.service'

export const configResolver = () => {
  const configService = inject(ConfigService)
  return configService.config$
}

export const initialDataResolver = () => {
  const versionService = inject(VersionService)
  const organizationService = inject(OrganizationService)
  const navigationService = inject(NavigationService)

  // Fork join multiple API endpoint calls to wait all of them to finish
  return forkJoin([
    versionService.get(),
    organizationService.getBrief(),
    // datasetService.countDatasets(),
    navigationService.get(),
  ])
}
