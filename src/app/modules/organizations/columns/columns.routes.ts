import type { Routes } from '@angular/router'
import { DataTypesPropertiesComponent } from './data-types/data-types-properties.component'
import { DataTypesTaxLotsComponent } from './data-types/data-types-taxlots.component'
import { GeocodingPropertiesComponent } from './geocoding/geocoding-properties.component'
import { GeocodingTaxlotsComponent } from './geocoding/geocoding-taxlots.component'
import { ImportSettingsPropertiesComponent } from './import-settings/import-settings-properties.component'
import { ImportSettingsTaxLotsComponent } from './import-settings/import-settings-taxlots.component'
import { ListPropertiesComponent } from './list/list-properties.component'
import { ListTaxLotComponent } from './list/list-taxlots.component'
import { MappingsComponent } from './mappings/mappings.component'

export default [
  {
    path: 'list',
    pathMatch: 'full',
    redirectTo: 'list/properties',
  },
  {
    path: 'list/properties',
    title: 'Column List',
    component: ListPropertiesComponent,
  },
  {
    path: 'list/taxlots',
    title: 'Column List',
    component: ListTaxLotComponent,
  },
  {
    path: 'geocoding',
    pathMatch: 'full',
    redirectTo: 'geocoding/properties',
  },
  {
    path: 'geocoding/properties',
    title: 'Geocoding Order',
    component: GeocodingPropertiesComponent,
  },
  {
    path: 'geocoding/taxlots',
    title: 'Geocoding Order',
    component: GeocodingTaxlotsComponent,
  },
  {
    path: 'data-types',
    pathMatch: 'full',
    redirectTo: 'data-types/properties',
  },
  {
    path: 'data-types/properties',
    title: 'Data Types',
    component: DataTypesPropertiesComponent,
  },
  {
    path: 'data-types/taxlots',
    title: 'Data Types',
    component: DataTypesTaxLotsComponent,
  },
  {
    path: 'import-settings',
    pathMatch: 'full',
    redirectTo: 'import-settings/properties',
  },
  {
    path: 'import-settings/properties',
    title: 'Import Settings',
    component: ImportSettingsPropertiesComponent,
  },
  {
    path: 'import-settings/taxlots',
    title: 'Import Settings',
    component: ImportSettingsTaxLotsComponent,
  },
  {
    path: 'mappings',
    title: 'Column Mappings',
    component: MappingsComponent,
  },
] satisfies Routes
