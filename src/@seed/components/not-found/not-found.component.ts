import { Component, Input } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  selector: 'seed-not-found',
  templateUrl: './not-found.component.html',
  imports: [MatIconModule],
})
export class NotFoundComponent {
  @Input() message: string
  @Input() icon: string
}
