import { recitals } from './recitals';

const dancerList = new Map();

for (const dance of recitals.at(-1)!.dances) {
  for (const dancer of dance.dancers) {
    dancerList.set(dancer, [...(dancerList.get(dancer) ?? []), dance.dance]);
  }
}

for (const [dancer, dances] of dancerList) {
  console.log(`${dances.length}\t${dancer}\t${dances.join('\t')}`);
}
