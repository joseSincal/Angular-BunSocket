import { Routes } from '@angular/router';
import { BoardPage } from './pages/board-page/board-page';
import { DeskPage } from './pages/desk-page/desk-page';
import { HomePage } from './pages/home-page/home-page';
import { DeskSelectPage } from './pages/desk-select-page/desk-select-page';
import { KioskPage } from './pages/kiosk-page/kiosk-page';

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'board',
    component: BoardPage,
  },
  {
    path: 'desk/:deskNumber',
    component: DeskPage,
  },

  {
    path: 'desk-select',
    component: DeskSelectPage,
  },
  {
    path: 'kiosk',
    component: KioskPage,
  },

  {
    path: '**',
    redirectTo: '',
  },
];
