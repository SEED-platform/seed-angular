import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ActivatedRoute } from '@angular/router'
import { DatasetService, ImportFile } from '@seed/api/dataset'
import { FirstFiveRowsResponse, MappingService, MappingSuggestionsResponse, RawColumnNamesResponse } from '@seed/api/mapping'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { AgGridAngular } from 'ag-grid-angular'
import { catchError, filter, forkJoin, of, Subject, switchMap, take, tap } from 'rxjs'

@Component({
  selector: 'seed-data-mapping',
  templateUrl: './data-mapping.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    MatIconModule,
    PageComponent,
    MatSidenavModule,
    MatButtonModule,
  ],
})
export class DataMappingComponent implements OnDestroy, OnInit {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _datasetService = inject(DatasetService)
  private _mappingService = inject(MappingService)
  private _router = inject(ActivatedRoute)
  private _userService = inject(UserService)
  helpOpened = false
  fileId = this._router.snapshot.params.id as number
  importFile: ImportFile
  orgId: number
  firstFiveRows: FirstFiveRowsResponse
  mappingSuggestions: MappingSuggestionsResponse
  rawColumnNames: RawColumnNamesResponse

  ngOnInit(): void {
    console.log('Data Mapping Component Initialized')
    this._userService.currentOrganizationId$
      .pipe(
        take(1),
        tap((orgId) => this.orgId = orgId),
        switchMap(() => this.getImportFile()),
        filter(Boolean),
        switchMap(() => this.getMappingData()),
      )
      .subscribe()
  }

  getImportFile() {
    return this._datasetService.getImportFile(this.orgId, this.fileId)
      .pipe(
        take(1),
        tap((importFile) => { this.importFile = importFile }),
        catchError(() => {
          console.log('bad importfile')
          return of(null)
        }),
      )
  }
  getMappingData() {
    return forkJoin([
      this._mappingService.firstFiveRows(this.orgId, this.fileId),
      this._mappingService.mappingSuggestions(this.orgId, this.fileId),
      this._mappingService.rawColumnNames(this.orgId, this.fileId),
    ])
      .pipe(
        take(1),
        tap(([firstFiveRows, mappingSuggestions, rawColumnNames]) => {
          this.firstFiveRows = firstFiveRows
          this.mappingSuggestions = mappingSuggestions
          this.rawColumnNames = rawColumnNames
        }),
      )
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
