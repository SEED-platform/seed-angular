import { Component, Input } from '@angular/core'

@Component({
  selector: 'seed-data-mapping-help',
  templateUrl: './help.component.html',
  imports: [],
})
export class HelpComponent {
  @Input() completed: Record<number, boolean>
  @Input() matchingPropertyColumnDisplayNames: string
  @Input() matchingTaxLotColumnDisplayNames: string
}
