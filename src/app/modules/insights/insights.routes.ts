import {
  CustomReportsComponent,
  DefaultReportsComponent,
  PortfolioSummaryComponent,
  ProgramOverviewComponent,
  PropertyInsightsComponent,
} from '.'

export default [
  { path: 'custom-reports', component: CustomReportsComponent },
  { path: 'default-reports', component: DefaultReportsComponent },
  { path: 'program-overview', component: ProgramOverviewComponent },
  { path: 'property-insights', component: PropertyInsightsComponent },
  { path: 'portfolio-summary', component: PortfolioSummaryComponent },
]
