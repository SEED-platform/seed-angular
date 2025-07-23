import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { Subject, takeUntil, tap } from 'rxjs'
import type { BenchmarkDataType, Cycle, SavingsTarget, SelectMeters } from '@seed/api'
import { MaterialImports } from '@seed/materials'

@Component({
  selector: 'seed-better-config',
  templateUrl: './better-config.component.html',
  imports: [CommonModule, FormsModule, MaterialImports, ReactiveFormsModule],
})
export class BetterConfigComponent implements OnInit, OnDestroy {
  @Input() cycles: Cycle[]
  @Input() orgId: number
  @Input() viewIds: number[] = []
  @Output() formChange = new EventEmitter<FormGroup>()
  private _unsubscribeAll$ = new Subject<void>()

  form = new FormGroup({
    benchmark_data_type: new FormControl<BenchmarkDataType>(null, [Validators.required]),
    cycle_id: new FormControl<number>(null),
    enable_pvwatts: new FormControl<boolean>(false),
    meter: new FormGroup({
      start_date: new FormControl<string>(null),
      end_date: new FormControl<string>(null),
    }),
    min_model_r_squared: new FormControl<number>(0.6, [Validators.required]),
    preprocess_meters: new FormControl<boolean>(false),
    portfolio_analysis: new FormControl<boolean>(false),
    savings_target: new FormControl<SavingsTarget>(null, [Validators.required]),
    select_meters: new FormControl<SelectMeters>('all', [Validators.required]),
  })
  benchmarkDataTypes: BenchmarkDataType[] = ['DEFAULT', 'GENERATE']
  savingsTargets: SavingsTarget[] = ['AGGRESSIVE', 'CONSERVATIVE', 'NOMINAL']

  ngOnInit(): void {
    const cycle = this.cycles?.[0]
    this.form.patchValue({
      cycle_id: cycle?.id,
      meter: {
        start_date: new Date(cycle?.start).toISOString(),
        end_date: new Date(cycle?.end).toISOString(),
      },
    })
    console.log(this.form.value)
    this.watchForm()
  }

  watchForm() {
    this.form.valueChanges
      .pipe(
        takeUntil(this._unsubscribeAll$),
        tap(() => { this.formChange.emit(this.form) }),
      )
      .subscribe()

    // this.form.get('cycle_id')?.valueChanges
    //   .pipe(
    //     tap((selection) => {
    //       const cycle = this.cycles.find((c) => c.id === selection)
    //       console.log('selection', selection)
    //     })
    //   )
    //   .subscribe()
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}
