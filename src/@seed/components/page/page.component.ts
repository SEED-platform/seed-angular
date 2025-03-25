import { Component, Input, ViewEncapsulation } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { SharedImports } from '@seed/directives'
import type { Config } from './page.types'

@Component({
  selector: 'seed-page',
  templateUrl: './page.component.html',
  imports: [MatButtonModule, MatIconModule, SharedImports],
  encapsulation: ViewEncapsulation.None,
  styles: ':host { @apply flex; @apply flex-auto }',
})
export class PageComponent {
  @Input() config: Config
}
