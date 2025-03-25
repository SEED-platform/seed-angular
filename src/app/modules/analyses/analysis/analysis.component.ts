import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import { PageComponent } from '@seed/components'

@Component({
  selector: 'seed-analyses-analysis',
  templateUrl: './analysis.component.html',
  imports: [MatIconModule, PageComponent],
})
export class AnalysisComponent implements OnInit {
  private _route = inject(ActivatedRoute)

  analysisId = Number(this._route.snapshot.paramMap.get('id'))

  ngOnInit(): void {
    console.log(`Analysis ${this.analysisId}`)
  }
}
