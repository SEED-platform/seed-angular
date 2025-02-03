import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-home',
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class HomeComponent {}
