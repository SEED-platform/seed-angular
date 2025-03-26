import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-custom-reports',
  templateUrl: './custom-reports.component.html',
  imports: [PageComponent],
})
export class CustomReportsComponent implements OnInit {
  ngOnInit(): void {
    console.log('Custom Reports')
  }
}
