import { DatePipe } from '@angular/common'
import type { AfterViewInit, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, Component, inject, ViewChild, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSort, MatSortModule } from '@angular/material/sort'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute } from '@angular/router'
import type { Dataset } from '@seed/api/dataset'
import { SharedImports } from '@seed/directives'

@Component({
  selector: 'seed-data',
  templateUrl: './data.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatSortModule, MatTableModule, SharedImports],
})
export class DataComponent implements OnInit, AfterViewInit {
  private _activatedRoute = inject(ActivatedRoute)

  @ViewChild(MatSort) sort: MatSort
  datasetsDataSource = new MatTableDataSource<Dataset>()
  datasetsColumns = ['name', 'importfiles', 'updated_at', 'last_modified_by', 'actions']

  ngOnInit(): void {
    this.datasetsDataSource.data = this._activatedRoute.snapshot.data.datasets as Dataset[]
  }

  ngAfterViewInit(): void {
    this.datasetsDataSource.sort = this.sort
  }

  trackByFn(_index: number, { id }: Dataset) {
    return id
  }
}
