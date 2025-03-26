import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-program-overview',
  templateUrl: './program-overview.component.html',
  imports: [PageComponent],
})
export class ProgramOverviewComponent implements OnInit {
  ngOnInit(): void {
    console.log('Program Overview')
  }
}
