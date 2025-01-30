import { inject } from '@angular/core'
import { forkJoin } from 'rxjs'
import { ConfigService } from '@seed/api/config'
import { OrganizationService } from '@seed/api/organization/organization.service'
import { UserService } from '@seed/api/user'
import { VersionService } from '@seed/api/version'

export const configResolver = () => {
  const configService = inject(ConfigService)
  return configService.config$
}

export const initialDataResolver = () => {
  const organizationService = inject(OrganizationService)
  const userService = inject(UserService)
  const versionService = inject(VersionService)

  // Fork join multiple API endpoint calls to wait on all of them to finish
  return forkJoin([versionService.get(), userService.getCurrentUser(), organizationService.getBrief()])
}
