import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'

@Component({
  selector: 'seed-organizations-email-templates',
  templateUrl: './organizations-email-templates.component.html',
})
export class OrganizationsEmailTemplatesComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations email templates')
  }
}
