import { recitals } from './showorder';

for (const recital of recitals) {
  console.log(`${recital.recital}`);
  for (const dance of recital.dances) {
    console.log(`${dance.song} by ${dance.artist}\t${dance.dance}`);
    console.log(`Choreography: ${dance.choreography}`);
    const dancerList = `Dancers: ${dance.dancers
      .toSorted()
      .map(d => `${d.split(',')[1].trim()} ${d.split(',')[0].trim()}`)
      .join(', ')}`;
    console.log(dancerList);
  }
}
