import { CommonModule } from '@angular/common'
import type { AfterViewInit, OnInit } from '@angular/core'
import { ChangeDetectionStrategy, Component, inject, viewChild, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSort, MatSortModule } from '@angular/material/sort'
import { MatTableDataSource, MatTableModule } from '@angular/material/table'
import { ActivatedRoute, Router } from '@angular/router'
import { from, skip } from 'rxjs'
import type { Dataset } from '@seed/api/dataset'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community'
import { AgGridAngular } from 'ag-grid-angular'
import { ConfigService } from '@seed/services'

@Component({
  selector: 'seed-data',
  templateUrl: './data.component.html',
  encapsulation: ViewEncapsulation.None,
  // changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AgGridAngular,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatTableModule,
    PageComponent,
  ],
})
export class DataComponent implements OnInit, AfterViewInit {
  private _configService = inject(ConfigService)
  private _route = inject(ActivatedRoute)
  private _router = inject(Router)
  private _userService = inject(UserService)
  readonly sort = viewChild.required(MatSort)
  // datasetsDataSource = new MatTableDataSource<Dataset>()
  datasets: Dataset[]
  datasetsColumns = ['name', 'importfiles', 'updated_at', 'last_modified_by', 'actions']
  gridApi: GridApi
  gridTheme$ = this._configService.gridTheme$
  columnDefs: ColDef[]

  ngOnInit(): void {
    this._init()

    // Rerun resolver and initializer on org change
    this._userService.currentOrganizationId$.pipe(skip(1)).subscribe(() => {
      from(this._router.navigate([this._router.url])).subscribe(() => {
        this._init()
      })
    })
  }

  setColumnDefs() {
    this.columnDefs = [
      { field: 'id', hide: true },
      { field: 'name', headerName: 'Name' },
      { field: 'importfiles', headerName: 'Files', valueGetter: ({ data }: { data: Dataset }) => data.importfiles.length },
      { field: 'updated_at', headerName: 'Updated At', valueGetter: ({ data }: { data: Dataset }) => new Date(data.updated_at).toLocaleDateString() },
      { field: 'last_modified_by', headerName: 'Last Modified By' },
      { field: 'actions', headerName: 'Actions', cellRenderer: this.actionsRenderer },
    ]
  }

  actionsRenderer({ data }: { data: Dataset}) {
    return `
      <div class="flex gap-2 mt-2 align-center">
      <span class="material-icons action-icon cursor-pointer text-secondary" title="Add Data Files" data-action="add">plus</span>
      <span class="material-icons action-icon cursor-pointer text-secondary" title="Delete Dataset" data-action="delete">clear</span>
      <span class="material-icons action-icon cursor-pointer text-secondary" title="Rename Dataset" data-action="rename">edit</span>
      </div>
    `
  }

  ngAfterViewInit(): void {
    return
    // this.datasetsDataSource.sort = this.sort()
  }

  onGridReady(agGrid: GridReadyEvent) {
    this.gridApi = agGrid.api
    this.gridApi.sizeColumnsToFit()
    // this.gridApi.addEventListener('cellClicked', this.onCellClicked.bind(this) as (event: CellClickedEvent) => void)
  }

  createDataset(): void {
    console.log('create dataset')
  }

  trackByFn(_index: number, { id }: Dataset) {
    return id
  }

  private _init() {
    this.setColumnDefs()
    this.datasets = this._route.snapshot.data.datasets as Dataset[]
  }
}
