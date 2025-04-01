import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-admin',
  templateUrl: './admin.component.html',
  imports: [MatButtonModule, MatIconModule, SharedImports],
})
export class AdminComponent {}
