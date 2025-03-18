import {
  CustomReportsComponent,
  DefaultReportsComponent,
  PortfolioSummaryComponent,
  ProgramOverviewComponent,
  PropertyInsightsComponent,
} from '.'

export default [
  { path: 'custom', component: CustomReportsComponent },
  { path: 'reports', component: DefaultReportsComponent },
  { path: 'overview', component: ProgramOverviewComponent },
  { path: 'property', component: PropertyInsightsComponent },
  { path: 'portfolio_summary', component: PortfolioSummaryComponent },
]
