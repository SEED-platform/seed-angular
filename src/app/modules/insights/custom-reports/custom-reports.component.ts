import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-insights-custom-reports',
  templateUrl: './custom-reports.component.html',
  imports: [MatIconModule, PageComponent],
})
export class CustomReportsComponent implements OnInit {
  ngOnInit(): void {
    console.log('Custom Reports')
  }
}
