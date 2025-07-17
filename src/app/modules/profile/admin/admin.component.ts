import { Component } from '@angular/core'
import { SharedImports } from '@seed/directives'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-admin',
  templateUrl: './admin.component.html',
  imports: [MaterialImports, SharedImports],
})
export class AdminComponent {}
