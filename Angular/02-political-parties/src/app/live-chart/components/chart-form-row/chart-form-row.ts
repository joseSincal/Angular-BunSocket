import { Component, input, output } from '@angular/core';
import { Party } from '../../../types';

@Component({
  selector: 'chart-form-row',
  imports: [],
  templateUrl: './chart-form-row.html',
  styleUrl: './chart-form-row.css',
})
export class ChartFormRow {
  public party = input.required<Party>();

  incrementVotes = output<Party>();
  decrementVotes = output<Party>();
  delete = output<Party>();
  update = output<Party>();

  private updatePartyTimeout: number | null = null;

  updatePartyName(name: string) {
    if (this.updatePartyTimeout) {
      clearTimeout(this.updatePartyTimeout);
    }

    this.updatePartyTimeout = setTimeout(() => {
      console.log('Emitiendo party: ', name);
      this.update.emit({ ...this.party(), name });
    }, 500);
  }
}
