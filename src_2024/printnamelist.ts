import { recitals } from './showorder';

console.log(`Class ID	Class Name	Dancer name`);
for (const recital of recitals) {
  for (const dance of recital.dances) {
    for (const dancer of dance.dancers
      .map(d => `${d.split(',')[1].trim()} ${d.split(',')[0].trim()}`)
      .toSorted()) {
      console.log(`${dance.order}\t${dance.dance}\t${dancer}`);
    }
  }
}
