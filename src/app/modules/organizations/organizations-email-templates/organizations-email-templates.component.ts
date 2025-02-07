import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule, MatDialog } from '@angular/material/dialog'
import { MatIconModule } from '@angular/material/icon'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { SharedImports } from '@seed/directives'
@Component({
  selector: 'seed-organizations-email-templates',
  templateUrl: './organizations-email-templates.component.html',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTableModule, CommonModule, SharedImports],
})
export class OrganizationsEmailTemplatesComponent implements OnInit {
  ngOnInit(): void {
    console.log('organizations email templates')
  }
}
