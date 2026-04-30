import { Component, inject, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar implements OnDestroy {
  public isHidden = signal(false);
  private router = inject(Router);

  private readonly hiddenRoutes = ['/kiosk', '/board'];

  private readonly _routerEvents = this.router.events
    .pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.url),
      startWith(this.router.url)
    )
    .subscribe((url) => {
      this.isHidden.set(this.hiddenRoutes.includes(url));
    });

  ngOnDestroy(): void {
    this._routerEvents.unsubscribe();
  }
}
