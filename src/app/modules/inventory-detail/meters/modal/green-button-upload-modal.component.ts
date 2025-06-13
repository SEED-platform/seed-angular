import { CommonModule } from '@angular/common'
import type { AfterViewInit, OnInit } from '@angular/core'
import { Component, inject, ViewChild } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import { MatStepperModule } from '@angular/material/stepper'
import type { Dataset } from '@seed/api/dataset'
import { InventoryService } from '@seed/api/inventory'
import { GreenButtonStep1Component } from './green-button-step1.component'

@Component({
  selector: 'seed-detail-green-button-upload-modal',
  templateUrl: './green-button-upload-modal.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatSelectModule,
    MatStepperModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    GreenButtonStep1Component,
  ],
})
export class GreenButtonUploadModalComponent implements AfterViewInit, OnInit {
  @ViewChild('step1') step1: GreenButtonStep1Component
  private _dialogRef = inject(MatDialogRef<GreenButtonUploadModalComponent>)
  private _inventoryService = inject(InventoryService)

  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    viewId: number;
    fillerCycle: number;
    systemId: number;
    datasets: Dataset[];
  }

  ngOnInit() {
    return null
  }

  ngAfterViewInit() {
    console.log(this.step1)
  }

  onFileSelected(file: File) {
    console.log('onFileSelected', file)
    // const formData = new FormData()
    // formData.append('file', file)
    // formData.append('import_record', this.)
  }

  onStep2() {
    console.log('onStep2')
  }

  onStep3() {
    console.log('onStep3')
  }

  dismiss() {
    this._dialogRef.close()
  }
}
