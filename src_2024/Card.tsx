import stringToColor from 'string-to-color';
import { Dance } from './recitals';

export interface CardProps {
  id: any;
  recital: string;
  recitalIndex: number;
  dance: Dance;
  index: number;
  isLast: boolean;
  moveDance: (recitalIndex: number, dragIndex: number, hoverIndex: number) => void;
  dancersInNextDance: string[];
  dancersInDanceAfterNext: string[];
}

export const Card = ({
  id: _id,
  recitalIndex,
  dance,
  index,
  isLast,
  moveDance,
  dancersInNextDance,
  dancersInDanceAfterNext,
}: CardProps) => {
  return (
    <div className="card" style={{ padding: '0.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ fontWeight: 'bold' }} title={dance.dancers.join('\n')}>
          {dance.dance}
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveDance(recitalIndex, index, index - 1)}>
            ↑
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => moveDance(recitalIndex, index, index + 1)}>
            ↓
          </button>
        </div>
      </div>
      <strong>
        <em>
          "{dance.song}" by {dance.artist}
        </em>
      </strong>
      <div>
        {dance.dancers.map((d, i) => (
          <>
            {i === 0 ? '' : ', '}
            <span style={{ color: stringToColor(d) }} key={d}>
              {d}
            </span>
          </>
        ))}
      </div>
      {dancersInNextDance.length > 0 && (
        <>
          <div style={{ marginTop: '0.5rem' }}>In next dance:</div>
          <ul style={{ color: 'red' }}>
            {dancersInNextDance.map(s => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      )}
      {dancersInDanceAfterNext.length > 0 && (
        <>
          <div style={{ marginTop: '0.5rem' }}>In dance after next:</div>
          <ul style={{ color: 'red' }}>
            {dancersInDanceAfterNext.map(s => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
