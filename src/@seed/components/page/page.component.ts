import { CommonModule } from '@angular/common'
import { Component, inject, Input, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatTooltipModule } from '@angular/material/tooltip'
import { SharedImports } from '@seed/directives'
import { DrawerService } from '../drawer'
import type { Config } from './page.types'

@Component({
  selector: 'seed-page',
  templateUrl: './page.component.html',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, SharedImports],
  encapsulation: ViewEncapsulation.None,
  styles: ':host { @apply flex; @apply flex-auto }',
})
export class PageComponent {
  @Input() config: Config
  private _drawerService = inject(DrawerService)

  toggleDrawer() {
    this._drawerService.toggle()
  }
}
