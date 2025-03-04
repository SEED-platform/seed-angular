import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop'
import { Component, ViewEncapsulation } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatIcon } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltip } from '@angular/material/tooltip'
import { SharedImports } from '@seed/directives'
import { GeocodingComponent } from './geocoding.component'

@Component({
  selector: 'seed-organizations-column-geocoding-properties',
  templateUrl: './geocoding.component.html',
  encapsulation: ViewEncapsulation.None,
  imports: [SharedImports, CdkDropList, CdkDrag, MatButtonModule, MatIcon, MatSelectModule, MatTooltip, ReactiveFormsModule],
})
export class GeocodingPropertiesComponent extends GeocodingComponent {
  type = 'PropertyState'
}
