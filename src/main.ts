import { bootstrapApplication } from '@angular/platform-browser'
import { AppComponent } from 'app/app.component'
import { appConfig } from 'app/app.config'
import 'app/ag-grid-modules'

bootstrapApplication(AppComponent, appConfig).catch((err: unknown) => {
  console.error(err)
})
