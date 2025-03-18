import type { OnInit } from '@angular/core'
import { Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-analyses-analysis',
  templateUrl: './analysis.component.html',
  imports: [MatIconModule, PageComponent],
})
export class AnalysisComponent implements OnInit {
  ngOnInit(): void {
    console.log('Analysis')
  }
}
