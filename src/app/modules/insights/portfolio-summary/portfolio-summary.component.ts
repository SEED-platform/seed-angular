import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-portfolio-summary',
  templateUrl: './portfolio-summary.component.html',
  imports: [PageComponent],
})
export class PortfolioSummaryComponent implements OnInit {
  ngOnInit(): void {
    console.log('Portfolio Summary')
  }
}
