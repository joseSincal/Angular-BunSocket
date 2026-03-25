import { createDefaultParties } from '../data/default-parties.data';
import type { PoliticalParty } from '../types';

interface PartiesState {
    parties: PoliticalParty[];
}

export class PartiesStore {
    private readonly state: PartiesState = {
        parties: createDefaultParties(),
    };

    getAll(): PoliticalParty[] {
        return this.state.parties;
    }

    findById(id: string): PoliticalParty | undefined {
        return this.state.parties.find((party) => party.id === id);
    }

    add(party: PoliticalParty): void {
        this.state.parties.push(party);
    }

    remove(id: string): boolean {
        const initialLength = this.state.parties.length;
        this.state.parties = this.state.parties.filter(
            (party) => party.id !== id,
        );
        return this.state.parties.length < initialLength;
    }

    reset(): void {
        this.state.parties = createDefaultParties();
    }
}
