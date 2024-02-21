import { produce } from 'immer';
import { useEffect, useState } from 'react';
import './App.css';
import { Card } from './Card';
import { Recital, recitals as recitalsOriginal } from './recitals';

const localStorageKey = 'recitals-2024';

const recitalsFromLocalStorage =
  (JSON.parse(window.localStorage.getItem(localStorageKey)!) as Recital[]) ?? recitalsOriginal;

export const App = () => {
  const [recitals, setRecitals] = useState(recitalsFromLocalStorage);

  const textList = `Recital Name\tOrder\tClass/Dance\tSong/Artist\tDancers\n${recitals
    .map(r =>
      r.dances
        .map(
          (d, idx) =>
            `${r.recital}\t${idx + 1}\t${d.dance}\t${d.song} by ${d.artist}\t${[...d.dancers]
              .sort()
              .join('\t')}`
        )
        .join('\n')
    )
    .join('\n\n')}`;

  useEffect(() => {
    window.localStorage.setItem(localStorageKey, JSON.stringify(recitals));
  }, [recitals]);

  const save = () => window.localStorage.setItem(localStorageKey, JSON.stringify(recitals));

  const moveDance = (recitalIndex: number, dragIndex: number, hoverIndex: number) => {
    setRecitals(prevRecitals =>
      produce(prevRecitals, draft => {
        draft[recitalIndex].dances.splice(dragIndex, 1);
        draft[recitalIndex].dances.splice(
          hoverIndex,
          0,
          prevRecitals[recitalIndex].dances[dragIndex]
        );
      })
    );
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textList);
    } catch (e: any) {
      alert(`Could not copy: ${e.message}`);
    }
  };

  return (
    <div className="container">
      <div style={{ flexGrow: 1 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            width: '100%',
          }}>
          {recitals.map((recital, recitalIndex) => (
            <details key={recital.recital}>
              <summary>{recital.recital}</summary>
              {recital.dances.map((dance, idx) => {
                const dancersInNextDance = dance.dancers.filter(s =>
                  recital.dances[idx + 1]?.dancers.includes(s)
                );
                const dancersInDanceAfterNext = dance.dancers.filter(s =>
                  recital.dances[idx + 2]?.dancers.includes(s)
                );
                return (
                  <Card
                    key={dance.dance}
                    id={dance.dance}
                    recital={recital.recital}
                    recitalIndex={recitalIndex}
                    dance={dance}
                    index={idx}
                    isLast={idx === recital.dances.length - 1}
                    moveDance={moveDance}
                    dancersInNextDance={dancersInNextDance}
                    dancersInDanceAfterNext={dancersInDanceAfterNext}
                  />
                );
              })}
            </details>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'row' }}>
          <a
            download="recital-order-2024.txt"
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(textList)}`}>
            Download list
          </a>
          <button type="button" onClick={copy}>
            Copy list
          </button>
          {/* <button type="button" onClick={save}>
            Save
          </button> */}
          <button
            type="button"
            style={{ marginLeft: 'auto' }}
            onClick={() => setRecitals(recitalsOriginal)}>
            Reset list
          </button>
        </div>
        <textarea
          style={{ overflowX: 'scroll', whiteSpace: 'pre' }}
          cols={69}
          rows={30}
          disabled
          value={textList}
        />
      </div>
    </div>
  );
};
