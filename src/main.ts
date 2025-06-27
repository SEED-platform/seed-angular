import { bootstrapApplication } from '@angular/platform-browser'
import { CheckboxEditorModule, ClientSideRowModelModule, ColumnAutoSizeModule, EventApiModule, ModuleRegistry, PaginationModule, RowApiModule, SelectEditorModule, TextEditorModule, ValidationModule } from 'ag-grid-community'
import { AppComponent } from 'app/app.component'
import { appConfig } from 'app/app.config'

// TEMP - should be overwritten when analyses pr is merged

ModuleRegistry.registerModules([
  CheckboxEditorModule,
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  EventApiModule,
  PaginationModule,
  RowApiModule,
  SelectEditorModule,
  TextEditorModule,
  ValidationModule,
])

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err)
})
