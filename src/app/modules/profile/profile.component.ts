import { CommonModule } from '@angular/common'
import { Component, ViewEncapsulation } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SharedImports } from '@seed/directives'
import { ProfileDeveloperComponent } from './developer/developer.component'
import { ProfileInfoComponent } from './info/info.component'
import { ProfileSecurityComponent } from './security/security.component'

@Component({
  selector: 'seed-profile',
  templateUrl: './profile.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, SharedImports, ProfileInfoComponent, ProfileDeveloperComponent, ProfileSecurityComponent, RouterOutlet],
})
export class ProfileComponent {
  tabs = ['Profile Info', 'Security', 'Developer', 'Admin']
  activeTab = 0

  selectTab(index: number): void {
    this.activeTab = index
  }
}
