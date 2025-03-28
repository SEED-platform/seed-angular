import { Component, ViewEncapsulation } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-contact',
  templateUrl: './contact.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [PageComponent],
})
export class ContactComponent {}
