import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-insights-portfolio-summary',
  templateUrl: './portfolio-summary.component.html',
  imports: [MatIconModule, PageComponent],
})
export class PortfolioSummaryComponent implements OnInit {
  ngOnInit(): void {
    console.log('Portfolio Summary')
  }
}
