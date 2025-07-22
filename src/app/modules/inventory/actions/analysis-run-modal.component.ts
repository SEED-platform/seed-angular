import { CommonModule } from '@angular/common'
import type { OnDestroy, OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { MaterialImports } from '@seed/materials'
import { SEEDValidators } from '@seed/validators'
import { Subject } from 'rxjs'

@Component({
  selector: 'seed-analysis-run-modal',
  templateUrl: './analysis-run-modal.component.html',
  imports: [CommonModule, FormsModule, MaterialImports, ReactiveFormsModule],
})
export class AnalysisRunModalComponent implements OnInit, OnDestroy {
  private _unsubscribeAll$ = new Subject<void>()

  existingNames: string[] = []

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    viewIds: number[];
  }

  form = new FormGroup({
    name: new FormControl<string | null>(null, [Validators.required, SEEDValidators.uniqueValue(this.data.existingNames)]),
    type: new FormControl<string | null>(null, [Validators.required]),
    config: new FormGroup({}) // placeholder for dynamic controls
  })

  ngOnInit(): void {
    // Initialization logic here
  }

  ngOnDestroy(): void {
    this._unsubscribeAll$.next()
    this._unsubscribeAll$.complete()
  }
}