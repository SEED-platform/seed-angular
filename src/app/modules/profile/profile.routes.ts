import type { Routes } from '@angular/router'
import { ProfileDeveloperComponent } from 'app/modules/profile/developer/developer.component'
import { ProfileInfoComponent } from 'app/modules/profile/info/info.component'
import { ProfileSecurityComponent } from 'app/modules/profile/security/security.component'

export default [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'info', // Default tab (first tab)
  },
  {
    path: 'info',
    title: 'Profile Info',
    component: ProfileInfoComponent,
  },
  {
    path: 'security',
    title: 'Security',
    component: ProfileSecurityComponent,
  },
  {
    path: 'developer',
    title: 'Developer',
    component: ProfileDeveloperComponent,
  },
] satisfies Routes
