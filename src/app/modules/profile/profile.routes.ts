import type { Routes } from '@angular/router'
import { AdminComponent } from 'app/modules/profile/admin/admin.component'
import { ProfileDeveloperComponent } from 'app/modules/profile/developer/developer.component'
import { ProfileInfoComponent } from 'app/modules/profile/info/info.component'
import { ProfileSecurityComponent } from 'app/modules/profile/security/security.component'

export default [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'info',
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
  {
    path: 'admin',
    title: 'Admin',
    component: AdminComponent,
  },
] satisfies Routes
