import { Clipboard } from '@angular/cdk/clipboard'
import { Component, inject, input } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { SnackBarService } from '../../../app/core/snack-bar/snack-bar.service'

@Component({
  selector: 'seed-clipboard',
  templateUrl: './clipboard.component.html',
  imports: [MatButtonModule, MatIconModule],
})
export class ClipboardComponent {
  private _clipboard = inject(Clipboard)
  private _snackBar = inject(SnackBarService)

  text = input<string>()

  // Called when the user clicks the icon button.
  copyText(): void {
    this._clipboard.copy(this.text())
    this._snackBar.success('Copied!')
  }
}
