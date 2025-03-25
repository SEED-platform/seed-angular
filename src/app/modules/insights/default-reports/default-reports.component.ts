import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-default-reports',
  templateUrl: './default-reports.component.html',
  imports: [PageComponent],
})
export class DefaultReportsComponent implements OnInit {
  ngOnInit(): void {
    console.log('Default Reports')
  }
}
