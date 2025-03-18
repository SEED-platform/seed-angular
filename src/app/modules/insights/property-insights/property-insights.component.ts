import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-insights-property-insights',
  templateUrl: './property-insights.component.html',
  imports: [MatIconModule, PageComponent],
})
export class PropertyInsightsComponent implements OnInit {
  ngOnInit(): void {
    console.log('Property Insights')
  }
}
