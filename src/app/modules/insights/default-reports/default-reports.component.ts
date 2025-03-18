import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-insights-default-reports',
  templateUrl: './default-reports.component.html',
  imports: [MatIconModule, PageComponent],
})
export class DefaultReportsComponent implements OnInit {
  ngOnInit(): void {
    console.log('Default Reports')
  }
}
