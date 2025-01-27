import { recitals } from './showorder';

const dxr = [];

for (const recital of recitals) {
  const dances = recital.dances.toSorted((a, b) => a.dance.localeCompare(b.dance));
  for (const dance of dances) {
    console.log(``);
    console.log(`${dance.dance}`);
    // const dancerXref = Object.fromEntries(dance.dancers.map(d => [d, [] as string[]]));
    for (const dancer of dance.dancers) {
      const otherDances = dances
        .filter(d => d.dance !== dance.dance && d.dancers.includes(dancer))
        .map(d => d.dance);
      // dancerXref[dancer] = otherDances;
      console.log(`${dancer}\t${otherDances.join('\t')}`);
    }
  }
}
