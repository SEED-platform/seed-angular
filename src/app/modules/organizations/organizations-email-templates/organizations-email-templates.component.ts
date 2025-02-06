import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { SharedImports } from '@seed/directives'
@Component({
  selector: 'seed-organizations-email-templates',
  templateUrl: './organizations-email-templates.component.html',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, SharedImports],
})
export class OrganizationsEmailTemplatesComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations email templates')
  }
}
