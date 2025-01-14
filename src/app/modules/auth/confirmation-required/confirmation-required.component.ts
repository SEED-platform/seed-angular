import { Component, ViewEncapsulation } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Animations } from '@seed/animations'

@Component({
  selector: 'auth-confirmation-required',
  templateUrl: './confirmation-required.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: Animations,
  imports: [RouterLink],
})
export class AuthConfirmationRequiredComponent {}
