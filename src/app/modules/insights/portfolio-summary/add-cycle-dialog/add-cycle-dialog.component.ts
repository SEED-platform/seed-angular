import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { inject } from '@angular/core'
import { Component, ViewEncapsulation } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'
import { Subject } from 'rxjs'
import { SharedImports } from '@seed/directives'
import { type Cycle, CycleService } from '@seed/api/cycle'
import { type Goal, GoalService } from '@seed/api/goal'
import { catchError, combineLatest, map, of, ReplaySubject, switchMap, tap, takeUntil } from 'rxjs'
import type { MatSelectChange } from '@angular/material/select'
import { MatSelectModule } from '@angular/material/select'
import { AnnualReport, SalesforcePortfolioService } from '@seed/api/salesforce-portfolio'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import type { AddCycleData, ConfigureGoalsData } from '../portfolio-summary.types'

@Component({
  selector: 'seed-add-cycle-dialog',
  templateUrl: './add-cycle-dialog.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    SharedImports,
    MatSelectModule,
  ],
})
export class AddCycleDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribeAll$ = new Subject<void>()
  private _cycleService = inject(CycleService)
  private _goalService = inject(GoalService)
  private _salesforcePortfolioService = inject(SalesforcePortfolioService)
  cycles: Cycle[] = []
  selectedCycle?: Cycle = null;
  selectedAnnualReport?: AnnualReport = null;
  data = inject(MAT_DIALOG_DATA) as AddCycleData
  isLoggedIntoBbSalesforce: boolean
  annualReports: AnnualReport[] = []
  private _dialogRef = inject(MatDialogRef<AddCycleDialogComponent>)

  ngOnInit(): void {
    this._cycleService.cycles$.pipe(takeUntil(this._unsubscribeAll$)).subscribe((cycles) => {
      this.cycles = cycles
    })

    this.isLoggedIntoBbSalesforce = this.data.isLoggedIntoBbSalesforce
    if (this.isLoggedIntoBbSalesforce) {
      this._salesforcePortfolioService.getAnnualReports(this.data.currentGoal.id).subscribe(annualReports => {
        this.annualReports = annualReports.results
      })
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }

  selectCycle(event: MatSelectChange): void {
    console.log(event)
    console.log(event.value)
    const selectedCycleId: number = event.value as number
    this.selectedCycle = this.cycles.find((c) => c.id === selectedCycleId)
    console.log(this.selectedCycle)
  }

  selectAnnualReport(event: MatSelectChange): void {
    console.log(event)
    console.log(event.value)
    const selectedAnnualReportId: string = event.value as string
    this.selectedAnnualReport = this.annualReports.find((r) => r.id === selectedAnnualReportId)
    console.log(this.selectedAnnualReport)
  }

  submit(): void {
    console.log(this.selectedAnnualReport)
    console.log(this.selectedCycle)
    this._goalService.createCycleGoal(
      this.data.currentGoal.id, 
      this.selectedCycle.id, 
      this.selectedAnnualReport.id, 
      this.selectedAnnualReport.name,
    ).subscribe(newCycleGoal => {
      console.log(newCycleGoal)
      this._dialogRef.close(newCycleGoal)
    })
  }
}
