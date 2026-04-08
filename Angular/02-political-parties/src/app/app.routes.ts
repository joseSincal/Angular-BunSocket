import { Routes } from '@angular/router';
import { ChartPage } from './live-chart/pages/chart-page/chart-page';

export const routes: Routes = [
  {
    path: '',
    component: ChartPage,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
