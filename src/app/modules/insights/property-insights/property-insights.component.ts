import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-property-insights',
  templateUrl: './property-insights.component.html',
  imports: [PageComponent],
})
export class PropertyInsightsComponent implements OnInit {
  ngOnInit(): void {
    console.log('Property Insights')
  }
}
