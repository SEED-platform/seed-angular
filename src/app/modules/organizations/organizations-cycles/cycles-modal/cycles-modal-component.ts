import { Component, inject, OnInit } from '@angular/core'
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'
import { CommonModule } from '@angular/common'
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog'
import { MatFormFieldModule } from '@angular/material/form-field'
import { FormsModule } from '@angular/forms'
import { MatInputModule } from '@angular/material/input'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { provideNativeDateAdapter } from '@angular/material/core'

@Component({
  selector: 'cycles-modal',
  templateUrl: './cycles-modal-component.html',
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatDatepickerModule
  ],
})
export class CyclesModalComponent implements OnInit {
  data = inject(MAT_DIALOG_DATA) as { message: string }
  private dialogRef = inject(MatDialogRef<CyclesModalComponent>)

  ngOnInit(): void {
    console.log('data', this.data)
  }

  close() {
    this.dialogRef.close()
  }
}