import type { Route, UrlSegment } from '@angular/router'
import { initialDataResolver } from 'app/app.resolvers'
import { AuthGuard } from 'app/core/auth/guards/auth.guard'
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard'
import { LayoutComponent } from 'app/layout/layout.component'
import { AboutComponent } from './modules/main/about/about.component'
import { ContactComponent } from './modules/main/contact/contact.component'
import { DocumentationComponent } from './modules/main/documentation/documentation.component'
import { HomeComponent } from './modules/main/home/home.component'
import {
  OrganizationsListComponent,
  OrganizationsNavComponent,
} from './modules/organizations'

const inventoryTypeMatcher = (segments: UrlSegment[]) => {
  if (segments.length === 1 && ['properties', 'taxlots'].includes(segments[0].path)) {
    return { consumed: segments, posParams: { type: segments[0] } }
  }
  return null
}

export const appRoutes: Route[] = [
  // Redirect empty path to '/dashboard'
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  // Redirect signed-in user to the '/dashboard'
  //
  // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
  // path. Below is another redirection for that path to redirect the user to the desired
  // location. This is a small convenience to keep all main routes together here on this file.
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },

  // Public auth routes for unauthenticated users
  {
    path: '',
    canActivate: [NoAuthGuard],
    canActivateChild: [NoAuthGuard],
    component: LayoutComponent,
    data: {
      layout: 'landing',
    },
    children: [
      {
        path: '',
        loadChildren: () => import('app/modules/auth/auth.routes'),
      },
    ],
  },

  // Authenticated routes
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: {
      initialData: initialDataResolver,
    },
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        component: HomeComponent,
      },
      {
        matcher: inventoryTypeMatcher,
        loadChildren: () => import('app/modules/inventory/inventory.routes'),
      },
      { path: 'about', title: 'About', component: AboutComponent },
      { path: 'contact', title: 'Contact', component: ContactComponent },
      { path: 'documentation', title: 'Documentation', component: DocumentationComponent },
      { path: 'organizations', component: OrganizationsListComponent },
      {
        path: 'organizations/:organizationId',
        component: OrganizationsNavComponent,
        loadChildren: () => import('app/modules/organizations/organizations.routes'),
      },
      // 404, redirect to dashboard
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
]
