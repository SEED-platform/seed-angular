import { CdkScrollable } from '@angular/cdk/scrolling'
import { Component, ViewEncapsulation } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { SEEDLoadingBarComponent } from '@seed/components'

@Component({
  selector: 'layout-empty',
  templateUrl: './empty.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [CdkScrollable, RouterOutlet, SEEDLoadingBarComponent],
})
export class EmptyLayoutComponent {}
