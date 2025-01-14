import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '../../../../@seed'

@Component({
  selector: 'seed-contact',
  templateUrl: './contact.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports],
})
export class ContactComponent {}
