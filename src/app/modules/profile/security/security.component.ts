import { Component, ViewEncapsulation } from '@angular/core'
import type { UntypedFormBuilder } from '@angular/forms'
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { SharedImports } from '@seed/directives'
@Component({
  selector: 'seed-profile-security',
  templateUrl: './security.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [MatIconModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, SharedImports],
})
export class ProfileSecurityComponent {
  currentPassword: FormControl = new FormControl('', [Validators.required])

  newPassword: FormControl = new FormControl('', [Validators.required])

  confirmNewPassword: FormControl = new FormControl('', [Validators.required])

  constructor(private _formBuilder: UntypedFormBuilder) {}

  onSubmit() {
    // Handle form submission (e.g., send the form data to an API)
    console.log('Form Submitted', {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmNewPassword: this.confirmNewPassword,
    })
  }
}
