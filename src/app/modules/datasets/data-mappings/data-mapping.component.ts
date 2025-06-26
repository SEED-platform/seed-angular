import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSidenavModule } from '@angular/material/sidenav'
import { ActivatedRoute } from '@angular/router'
import { DatasetService } from '@seed/api/dataset'
import { UserService } from '@seed/api/user'
import { PageComponent } from '@seed/components'
import { AgGridAngular } from 'ag-grid-angular'
import { Subject, switchMap, take, tap } from 'rxjs'

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
  private _router = inject(ActivatedRoute)
  private _userService = inject(UserService)
  helpOpened = false
  fileId = this._router.snapshot.params.id as number
  orgId: number

  ngOnInit(): void {
    console.log('Data Mapping Component Initialized')
    this._userService.currentOrganizationId$
      .pipe(
        take(1),
        tap((orgId) => this.orgId = orgId),
        switchMap(() => this._datasetService.getImportFile(this.orgId, this.fileId)),
        tap((importFile) => { console.log('import file', importFile) }),
      )
      .subscribe()
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
