import type { OnInit } from '@angular/core'
import { Component, ViewEncapsulation } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-organizations-settings',
  templateUrl: './organizations-settings.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatIconModule,
  ],
})
export class OrganizationsSettingsComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations settings')
  }
}
