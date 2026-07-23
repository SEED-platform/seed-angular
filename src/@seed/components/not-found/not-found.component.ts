import { Component, Input } from '@angular/core'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-not-found',
  templateUrl: './not-found.component.html',
  imports: [MaterialImports],
})
export class NotFoundComponent {
  @Input() message: string
  @Input() icon: string
}
