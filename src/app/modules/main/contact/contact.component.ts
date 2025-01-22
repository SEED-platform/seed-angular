import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-contact',
  templateUrl: './contact.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ContactComponent {}
