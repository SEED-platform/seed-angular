import { JsonPipe } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { ActivatedRoute } from '@angular/router'
import type { ListDatasetsResponse } from '@seed/api/dataset'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-data',
  templateUrl: './data.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [MatButtonModule, MatIconModule, SharedImports, JsonPipe],
})
export class DataComponent implements OnInit {
  private _activatedRoute = inject(ActivatedRoute)

  data: ListDatasetsResponse

  ngOnInit(): void {
    this.data = this._activatedRoute.snapshot.data.data as ListDatasetsResponse
  }
}
