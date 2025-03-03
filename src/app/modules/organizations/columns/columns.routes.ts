import type { Routes } from '@angular/router'
import { DataTypesPropertiesComponent } from './data_types/data-types-properties.component'
import { DataTypesTaxLotsComponent } from './data_types/data-types-taxlots.component'
import { GeocodingPropertiesComponent } from './geocoding/geocoding-properties.component'
import { GeocodingTaxlotsComponent } from './geocoding/geocoding-taxlots.component'
import { ListPropertiesComponent } from './list/list-properties.component'
import { ListTaxLotComponent } from './list/list-taxlots.component'
import { MatchingCriteriaPropertiesComponent } from './matching_critieria/matching-criteria-properties.component'
import { MatchingCriteriaTaxLotsComponent } from './matching_critieria/matching-criteria-taxlots.component'

export default [
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
    path: 'data_types/properties',
    title: 'Data Types',
    component: DataTypesPropertiesComponent,
  },
  {
    path: 'data_types/taxlots',
    title: 'Data Types',
    component: DataTypesTaxLotsComponent,
  },
  {
    path: 'matching_criteria/properties',
    title: 'Matching Criteria',
    component: MatchingCriteriaPropertiesComponent,
  },
  {
    path: 'matching_criteria/taxlots',
    title: 'Matching Criteria',
    component: MatchingCriteriaTaxLotsComponent,
  },
] satisfies Routes
