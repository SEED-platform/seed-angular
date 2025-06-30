import { bootstrapApplication } from '@angular/platform-browser'
import {
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  EventApiModule,
  ModuleRegistry,
  PaginationModule,
  ValidationModule,
} from 'ag-grid-community'
import { AppComponent } from 'app/app.component'
import { appConfig } from 'app/app.config'

ModuleRegistry.registerModules([ClientSideRowModelModule, ColumnAutoSizeModule, EventApiModule, PaginationModule, ValidationModule])

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err)
})
