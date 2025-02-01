import { Component, ViewEncapsulation } from '@angular/core'
import { SharedImports } from '@seed/directives'
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatIconModule } from '@angular/material/icon'
@Component({
  selector: 'seed-profile-developer',
  templateUrl: './developer.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    ReactiveFormsModule,
    SharedImports,
  ],
})
export class ProfileDeveloperComponent {
  apikey = '12345ABCDE'
}
