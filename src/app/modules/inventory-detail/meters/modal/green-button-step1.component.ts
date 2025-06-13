import type { OnInit } from '@angular/core'
import { Component, EventEmitter, Input, Output } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatSelectModule } from '@angular/material/select'
import type { MatStepper } from '@angular/material/stepper'
import type { Dataset } from '@seed/api/dataset'

@Component({
  selector: 'seed-green-button-step1',
  templateUrl: './green-button-step1.component.html',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class GreenButtonStep1Component implements OnInit {
  @Input() data: {
    orgId: number;
    viewId: number;
    fillerCycle: number;
    systemId: number;
    datasets: Dataset[];
  }
  @Input() stepper: MatStepper
  @Output() fileSelected = new EventEmitter<File>()
  readonly allowedTypes = ['application/xml', 'text/xml']

  file?: File
  dataset: Dataset

  form = new FormGroup({
    dataset: new FormControl<Dataset>(null, Validators.required),
    file: new FormControl<string | null>(null, Validators.required),
  })

  ngOnInit() {
    this.dataset = this.data.datasets[0]
    this.form.patchValue({ dataset: this.dataset })
  }

  onSelectFile(fileList: FileList): Promise<void> {
    if (fileList.length === 0) {
      return
    }
    const [file] = fileList
    this.file = file
    this.form.patchValue({ file: this.file.name })
  }

  onSubmit() {
    this.fileSelected.emit(this.file)
    this.stepper.next()
  }
}
