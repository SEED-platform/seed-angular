import type { Routes } from '@angular/router'
import {
  CustomReportsComponent,
  DefaultReportsComponent,
  PortfolioSummaryComponent,
  ProgramOverviewComponent,
  PropertyInsightsComponent,
} from '.'

export default [
  {
    path: 'custom-reports',
    title: 'Custom Reports',
    component: CustomReportsComponent,
  },
  {
    path: 'default-reports',
    title: 'Default Reports',
    component: DefaultReportsComponent,
  },
  {
    path: 'program-overview',
    title: 'Program Overview',
    component: ProgramOverviewComponent,
  },
  {
    path: 'property-insights',
    title: 'Property Insights',
    component: PropertyInsightsComponent,
  },
  {
    path: 'portfolio-summary',
    title: 'Portfolio Summary',
    component: PortfolioSummaryComponent,
  },
] satisfies Routes
