import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-insights-program-overview',
  templateUrl: './program-overview.component.html',
  imports: [MatIconModule, PageComponent],
})
export class ProgramOverviewComponent implements OnInit {
  ngOnInit(): void {
    console.log('program Overview')
  }
}
