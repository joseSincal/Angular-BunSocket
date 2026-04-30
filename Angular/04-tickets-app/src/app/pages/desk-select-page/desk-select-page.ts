import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface DeskOption {
  id: number;
  name: string;
  description: string;
  color: string;
}

const DESK_COLORS = [
  'bg-sky-500/20 border-sky-400/40',
  'bg-teal-500/20 border-teal-400/40',
  'bg-emerald-500/20 border-emerald-300/40',
  'bg-green-500/20 border-green-300/40',
  'bg-yellow-500/20 border-yellow-300/40',
  'bg-orange-500/20 border-orange-300/40',
  'bg-red-500/20 border-red-300/40',
  'bg-purple-500/20 border-purple-300/40',
  'bg-pink-500/20 border-pink-300/40',
  'bg-gray-500/20 border-gray-300/40',
  'bg-slate-500/20 border-slate-300/40',
  'bg-indigo-500/20 border-indigo-300/40',
  'bg-violet-500/20 border-violet-300/40',
  'bg-fuchsia-500/20 border-fuchsia-300/40',
  'bg-rose-500/20 border-rose-300/40',
] as const;

@Component({
  selector: 'app-desk-select-page',
  imports: [],
  templateUrl: './desk-select-page.html',
})
export class DeskSelectPage {
  /**
   * Define cuántos escritorios existen en la UI.
   * (Sin persistencia: solo afecta el layout/renderizado).
   */
  protected readonly deskCount = signal(6);

  protected readonly desks = computed<DeskOption[]>(() => {
    const safeCount = Math.max(0, this.deskCount());
    return Array.from({ length: safeCount }, (_, index) => {
      const id = index + 1;
      return {
        id,
        name: `Escritorio ${id}`,
        description: 'Atención al público',
        color: DESK_COLORS[index % DESK_COLORS.length],
      };
    });
  });

  protected readonly selectedDeskId = signal<number | null>(null);

  protected readonly canContinue = computed(() => this.selectedDeskId() !== null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  constructor() {
    const routeDeskNumber = this.route.snapshot.paramMap.get('deskNumber');
    const parsedDeskNumber = Number.parseInt(routeDeskNumber ?? '', 10);

    if (Number.isFinite(parsedDeskNumber) && parsedDeskNumber > 0) {
      this.selectedDeskId.set(parsedDeskNumber);
    }
  }

  protected selectDesk(deskId: number): void {
    this.selectedDeskId.set(deskId);
  }

  protected continue(): void {
    this.router.navigate(['/desk', this.selectedDeskId()]);
  }
}
