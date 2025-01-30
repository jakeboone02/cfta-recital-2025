import { Fragment, useState } from 'react';
import type { RecitalDanceInstance } from './types';

declare const initialData: RecitalDanceInstance[];

type MoveDance = (id: number | null, direction: 'up' | 'down' | number | null) => Promise<void>;

export const DanceRow = ({
  dance,
  moveDance,
  prev_prev_dance,
  prev_dance,
  next_dance,
  next_next_dance,
}: {
  dance: RecitalDanceInstance;
  moveDance: MoveDance;
  prev_prev_dance?: RecitalDanceInstance;
  prev_dance?: RecitalDanceInstance;
  next_dance?: RecitalDanceInstance;
  next_next_dance?: RecitalDanceInstance;
}) => {
  const md_up = () =>
    moveDance(dance.id, dance.recital_group === 'B' ? prev_prev_dance?.id ?? null : 'up');
  const md_down = () =>
    moveDance(dance.id, dance.recital_group === 'B' ? next_dance?.id ?? null : 'down');
  const disableUp =
    dance.follows_dance_id === null ||
    (dance.recital_group === 'B' &&
      prev_dance?.follows_dance_id === null &&
      prev_dance?.part === 1);
  const disableDown =
    (dance.recital_group !== 'B' && next_dance?.part !== dance.part) ||
    (dance.recital_group === 'B' && next_next_dance?.recital !== dance.recital);

  return (
    <tr>
      <td style={{ textWrap: 'nowrap' }}>
        {(dance.id ?? 'X') === 'X' ? (
          ''
        ) : (
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button title={`Move dance ${dance.id} up`} onClick={md_up} disabled={disableUp}>
              ˄
            </button>
            <button title={`Move dance ${dance.id} down`} onClick={md_down} disabled={disableDown}>
              ˅
            </button>
          </div>
        )}
      </td>
      {/* <td style={{ textWrap: 'nowrap' }}>{dance.recital}</td> */}
      <td>{dance.part}</td>
      <td>
        <div className="dance">
          <span>{dance.recital_group}</span>
          <span style={{ fontSize: 'small', color: 'gray' }}>{dance.id}</span>
        </div>
      </td>
      <td title={`ID: ${dance.id}, Follows: ${dance.follows_dance_id}`}>
        <div className="dance">
          <span>{dance.dance}</span>
          <span style={{ fontSize: 'small', color: 'gray' }}>{dance.choreography}</span>
        </div>
      </td>
      <td style={{ fontSize: 'small', textAlign: 'right' }}>{dance.dancer_count}</td>
      <td style={{ fontSize: 'small' }} className="red">
        {next_dance?.dancers.filter(d => dance.dancers.includes(d)).join(', ')}
      </td>
      <td style={{ fontSize: 'small' }} className="orange">
        {next_next_dance?.dancers.filter(d => dance.dancers.includes(d)).join(', ')}
      </td>
    </tr>
  );
};

export const App = () => {
  const [data, setData] = useState<RecitalDanceInstance[]>(initialData);

  const fetchData = async () => {
    const response = await fetch('/api/data');
    const data = (await response.json()) as RecitalDanceInstance[];
    setData(data);
  };

  const moveDance: MoveDance = async (id, direction) => {
    const response = await fetch('/api/sort', {
      method: 'POST',
      body: JSON.stringify([id, direction]),
    });
    const data = (await response.json()) as RecitalDanceInstance[];
    console.log(data);
    fetchData();
  };

  return (
    <div className="App">
      Hello, Dance World!
      <button onClick={() => fetchData()}>Fetch data</button>
      <table>
        <tbody>
          {data.map((dance, idx) => {
            const prev_prev_dance =
              data[idx - 2]?.recital === dance.recital ? data[idx - 2] : undefined;
            const prev_dance = data[idx - 1]?.recital === dance.recital ? data[idx - 1] : undefined;
            const next_dance = data[idx + 1]?.recital === dance.recital ? data[idx + 1] : undefined;
            const next_next_dance =
              data[idx + 2]?.recital === dance.recital ? data[idx + 2] : undefined;
            return (
              <Fragment key={`${dance.recital}-${dance.id}`}>
                {dance.recital !== data[idx - 1]?.recital && (
                  <>
                    <tr>
                      <th colSpan={8}>Recital {dance.recital}</th>
                    </tr>
                    <tr>
                      <th></th>
                      {/* <th>Recital</th> */}
                      <th>Part</th>
                      <th>Group</th>
                      <th>Dance</th>
                      <th>Dancers</th>
                      <th>In Next Dance</th>
                      <th>In Dance After Next</th>
                    </tr>
                  </>
                )}
                <DanceRow
                  dance={dance}
                  moveDance={moveDance}
                  prev_prev_dance={prev_prev_dance}
                  prev_dance={prev_dance}
                  next_dance={next_dance}
                  next_next_dance={next_next_dance}
                />
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <pre style={{ display: 'none' }}>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  );
};
