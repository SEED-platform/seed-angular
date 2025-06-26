import { CommonModule } from '@angular/common'
import type { OnInit } from '@angular/core'
import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { tap } from 'rxjs'
import { type Sensor, SensorService } from '@seed/api/sensor'
import { SEEDValidators } from '@seed/validators'

@Component({
  selector: 'seed-inventory-detail-sensors-form-modal',
  templateUrl: './form-modal.component.html',
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
})
export class FormModalComponent implements OnInit {
  private _dialogRef = inject(MatDialogRef<FormModalComponent>)
  private _sensorService = inject(SensorService)
  data = inject(MAT_DIALOG_DATA) as {
    orgId: number;
    viewId: number;
    sensor: Sensor;
    existingColumnNames: string[];
    existingDisplayNames: string[];
  }
  form = new FormGroup({
    display_name: new FormControl<string>('', SEEDValidators.uniqueValue(this.data.existingDisplayNames)),
    location_description: new FormControl<string>(''),
    description: new FormControl<string>(''),
    sensor_type: new FormControl<string>(''),
    units: new FormControl<string>(''),
    column_name: new FormControl<string>('', SEEDValidators.uniqueValue(this.data.existingColumnNames)),
  })

  ngOnInit() {
    this.patchForm()
    console.log('sensor form ngOnInit', this.data)
  }

  patchForm() {
    if (this.data.sensor) {
      this.form.patchValue(this.data.sensor)
    }
  }

  onSubmit() {
    this._sensorService
      .updateSensor(this.data.orgId, this.data.viewId, this.data.sensor.id, this.form.value as Sensor)
      .pipe(
        tap(() => {
          this.close(true)
        }),
      )
      .subscribe()
  }

  close(success = false) {
    this._dialogRef.close(success)
  }
}
