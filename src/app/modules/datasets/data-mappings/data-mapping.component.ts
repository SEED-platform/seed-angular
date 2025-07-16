import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatSidenavModule } from '@angular/material/sidenav'
import type { MatStepper } from '@angular/material/stepper'
import { MatStepperModule } from '@angular/material/stepper'
import { ActivatedRoute } from '@angular/router'
import { AgGridAngular } from 'ag-grid-angular'
import { catchError, filter, forkJoin, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs'
import { type Column, ColumnService } from '@seed/api/column'
import type { ColumnMappingProfile, ColumnMappingProfileType } from '@seed/api/column_mapping_profile'
import { ColumnMappingProfileService } from '@seed/api/column_mapping_profile'
import type { Cycle } from '@seed/api/cycle'
import { CycleService } from '@seed/api/cycle/cycle.service'
import type { ImportFile, MappingResultsResponse } from '@seed/api/dataset'
import { DatasetService } from '@seed/api/dataset'
import type { MappingSuggestionsResponse } from '@seed/api/mapping'
import { MappingService } from '@seed/api/mapping'
import type { Organization } from '@seed/api/organization'
import { OrganizationService } from '@seed/api/organization'
import type { ProgressResponse } from '@seed/api/progress'
import { UserService } from '@seed/api/user'
import { PageComponent, ProgressBarComponent } from '@seed/components'
import { UploaderService } from '@seed/services/uploader'
import { SnackBarService } from 'app/core/snack-bar/snack-bar.service'
import type { InventoryDisplayType, InventoryType, Profile } from 'app/modules/inventory'
import { HelpComponent } from './help.component'
import { MapDataComponent } from './step1/map-data.component'
import { SaveMappingsComponent } from './step3/save-mappings.component'
import { MatchMergeComponent } from './step4/match-merge.component'

@Component({
  selector: 'seed-data-mapping-stepper',
  templateUrl: './data-mapping.component.html',
  imports: [
    AgGridAngular,
    CommonModule,
    FormsModule,
    HelpComponent,
    MapDataComponent,
    MatchMergeComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatSelectModule,
    MatStepperModule,
    PageComponent,
    ProgressBarComponent,
    ReactiveFormsModule,
    SaveMappingsComponent,
  ],
})
export class DataMappingComponent implements OnDestroy, OnInit {
  @ViewChild('stepper') stepper!: MatStepper
  @ViewChild(MapDataComponent) mapDataComponent!: MapDataComponent
  @ViewChild(MatchMergeComponent) matchMergeComponent!: MatchMergeComponent
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _columnMappingProfileService = inject(ColumnMappingProfileService)
  private _columnService = inject(ColumnService)
  private _cycleService = inject(CycleService)
  private _datasetService = inject(DatasetService)
  private _mappingService = inject(MappingService)
  private _organizationService = inject(OrganizationService)
  private _snackBar = inject(SnackBarService)
  private _router = inject(ActivatedRoute)
  private _uploaderService = inject(UploaderService)
  private _userService = inject(UserService)
  columns: Column[]
  columnMappingProfiles: ColumnMappingProfile[] = []
  columnMappingProfileTypes: ColumnMappingProfileType[]
  columnNames: string[]
  completed = { 1: false, 2: false, 3: false, 4: false }
  currentProfile: Profile
  cycle: Cycle
  datasetId: number
  fileId = this._router.snapshot.params.id as number
  firstFiveRows: Record<string, unknown>[]
  helpOpened = false
  importFile: ImportFile
  inventoryType: InventoryType = 'properties'
  mappingResultsResponse: MappingResultsResponse
  mappingSuggestions: MappingSuggestionsResponse
  matchingPropertyColumnDisplayNames = ''
  matchingPropertyColumns: string[] = []
  matchingTaxLotColumnDisplayNames = ''
  matchingTaxLotColumns: string[] = []
  org: Organization
  orgId: number
  propertyColumns: Column[]
  rawColumnNames: string[] = []
  taxlotColumns: Column[]

  progressBarObj = this._uploaderService.defaultProgressBarObj

  ngOnInit(): void {
    // this._userService.currentOrganizationId$
    this._organizationService.currentOrganization$
      .pipe(
        take(1),
        tap((org) => {
          this.orgId = org.id
          this.org = org
        }),
        switchMap(() => this.getImportFile()),
        filter(Boolean),
        tap(() => { this.getProfiles() }),
        switchMap(() => this.getMappingData()),
        switchMap(() => this.getColumns()),
      )
      .subscribe()
  }

  getImportFile() {
    return this._datasetService.getImportFile(this.orgId, this.fileId)
      .pipe(
        take(1),
        tap((importFile) => {
          this.importFile = importFile
          this.datasetId = importFile.dataset?.id
          this.columnMappingProfileTypes = importFile.source_type === 'BuildingSync Raw' ? ['BuildingSync Default', 'BuildingSync Custom'] : ['Normal']
        }),
        catchError(() => {
          return of(null)
        }),
      )
  }

  getMappingData() {
    return forkJoin([
      this._cycleService.getCycle(this.orgId, this.importFile.cycle),
      this._mappingService.firstFiveRows(this.orgId, this.fileId),
      this._mappingService.mappingSuggestions(this.orgId, this.fileId),
      this._mappingService.rawColumnNames(this.orgId, this.fileId),
    ])
      .pipe(
        take(1),
        tap(([cycle, firstFiveRows, mappingSuggestions, rawColumnNames]) => {
          this.cycle = cycle
          this.firstFiveRows = firstFiveRows
          this.mappingSuggestions = mappingSuggestions
          this.rawColumnNames = rawColumnNames
        }),
      )
  }

  getColumns() {
    return forkJoin([
      this._organizationService.getMatchingCriteriaColumns(this.orgId, 'properties'),
      this._organizationService.getMatchingCriteriaColumns(this.orgId, 'taxlots'),
      this._columnService.propertyColumns$.pipe(take(1)),
      this._columnService.taxLotColumns$.pipe(take(1)),
    ])
      .pipe(
        take(1),
        tap(([
          matchingPropertyColumns,
          matchingTaxLotColumns,
          propertyColumns,
          taxlotColumns,
        ]) => {
          this.matchingPropertyColumns = matchingPropertyColumns as string[]
          this.matchingTaxLotColumns = matchingTaxLotColumns as string[]
          this.propertyColumns = propertyColumns
          this.taxlotColumns = taxlotColumns

          const propertyMap = new Map(propertyColumns.filter((c) => c.table_name === 'PropertyState').map((c) => [c.column_name, c.display_name]))
          const taxlotMap = new Map(taxlotColumns.filter((c) => c.table_name === 'TaxLotState').map((c) => [c.column_name, c.display_name]))

          this.matchingPropertyColumnDisplayNames = this.matchingPropertyColumns.map((name) => propertyMap.get(name) || name).join(', ')
          this.matchingTaxLotColumnDisplayNames = this.matchingTaxLotColumns.map((name) => taxlotMap.get(name) || name).join(', ')
        }),
      )
  }

  getProfiles() {
    this._columnMappingProfileService.getProfiles(this.orgId, this.columnMappingProfileTypes)
      .pipe(
        switchMap(() => this._columnMappingProfileService.profiles$),
        takeUntil(this._unsubscribeAll$),
        tap((profiles) => { this.columnMappingProfiles = profiles }),
      )
      .subscribe()
  }

  onCompleted(step: number) {
    this.completed[step] = true
    this.stepper.next()
  }

  startMapping() {
    const mappedData = this.mapDataComponent.mappedData
    this.columns = this.mapDataComponent.defaultInventoryType === 'Tax Lot' ? this.taxlotColumns : this.propertyColumns
    this.nextStep(1)

    const failureFn = () => {
      this._snackBar.alert('Error starting mapping')
    }
    const successFn = () => {
      this.nextStep(2)
      this.getMappingResults()
    }

    this._mappingService.startMapping(this.orgId, this.fileId, mappedData)
      .pipe(
        switchMap(() => this._mappingService.remapBuildings(this.orgId, this.fileId)),
        tap((response: ProgressResponse) => {
          this.progressBarObj.progress = response.progress
        }),
        switchMap((data) => {
          if (data.progress === 100) {
            successFn()
            return of(null)
          }

          return this._uploaderService.checkProgressLoop({
            progressKey: data.progress_key,
            successFn,
            failureFn,
            progressBarObj: this.progressBarObj,
          })
        }),
        takeUntil(this._unsubscribeAll$),
        catchError((error) => {
          console.log('Error starting mapping:', error)
          return of(null)
        }),
      )
      .subscribe()
  }

  getMappingResults(): void {
    this.nextStep(2)
    this._mappingService.mappingResults(this.orgId, this.fileId)
      .pipe(
        tap((mappingResultsResponse) => { this.mappingResultsResponse = mappingResultsResponse }),
      )
      .subscribe()
  }

  startMatchMerge() {
    this.nextStep(3)
    this.matchMergeComponent.startMatchMerge()
  }

  onMatchComplete() {
    this.completed[4] = true
  }

  nextStep(currentStep: number) {
    this.completed[currentStep] = true
    setTimeout(() => {
      this.stepper.next()
    })
  }

  backToMapping() {
    this.stepper.selectedIndex = 0
    this.completed = { 1: false, 2: false, 3: false, 4: false }
  }

  toggleHelp = () => {
    this.helpOpened = !this.helpOpened
  }

  onDefaultInventoryTypeChange(value: InventoryDisplayType) {
    this.inventoryType = value === 'Tax Lot' ? 'taxlots' : 'properties'
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
