import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'

@Component({
  selector: 'seed-organizations-members',
  templateUrl: './organizations-members.component.html',
})
export class OrganizationsMembersComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations members')
  }
}
