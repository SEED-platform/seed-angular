import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'

@Component({
  selector: 'seed-organizations-settings',
  templateUrl: './organizations-settings.component.html',
})
export class OrganizationsSettingsComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations settings')
  }
}
