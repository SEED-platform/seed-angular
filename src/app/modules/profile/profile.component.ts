import { Component, ViewEncapsulation } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import type { NavigationItem } from '@seed/components'
import { HorizontalNavigationComponent } from '@seed/components/navigation/horizontal/horizontal.component'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-profile',
  templateUrl: './profile.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [HorizontalNavigationComponent, SharedImports, RouterOutlet],
})
export class ProfileComponent {
  tabs = ['Profile Info', 'Security', 'Developer', 'Admin']

  readonly navigation: NavigationItem[] = [
    {
      id: 'profile',
      title: 'Profile',
      type: 'basic',
      icon: 'fa-solid:user',
      link: '/profile/info',
    },
    {
      id: 'security',
      title: 'Security',
      type: 'basic',
      icon: 'fa-solid:lock',
      link: '/profile/security',
    },
    {
      id: 'developer',
      title: 'Developer',
      type: 'basic',
      icon: 'fa-solid:code',
      link: '/profile/developer',
    },
    {
      id: 'admin',
      title: 'Admin',
      type: 'basic',
      icon: 'fa-solid:user-gear',
      link: '/profile/admin',
    },
  ]
}
