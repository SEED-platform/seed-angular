import { TextFieldModule } from '@angular/cdk/text-field'
import { NgClass } from '@angular/common'
import { Component, ViewEncapsulation } from '@angular/core'
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  Validators,
} from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'

@Component({
  selector: 'seed-profile-info',
  templateUrl: './info.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatIconModule,
    FormsModule,
    MatFormFieldModule,
    NgClass,
    MatInputModule,
    TextFieldModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
})
export class ProfileInfoComponent {

  firstName: FormControl = new FormControl('', [
    Validators.required,
  ])

  lastName: FormControl = new FormControl('', [
    Validators.required,
  ])

  email: FormControl = new FormControl('', [
    Validators.required,
  ])

  constructor(private _formBuilder: UntypedFormBuilder) {}

  onSubmit() {
    // Handle form submission (e.g., send the form data to an API)
    console.log('Form Submitted', { firstName: this.firstName, lastName: this.lastName, email: this.email })
  }
}
