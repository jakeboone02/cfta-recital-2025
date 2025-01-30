import { Database, SQLQueryBindings } from 'bun:sqlite';
import { Dance, RecitalDanceInstance, RecitalGroupOrder } from './src/types';

const db = new Database(`./build/database.db`);

const getRecitalOrderData = async () =>
  db
    .query<RecitalDanceInstance, SQLQueryBindings[]>(
      await Bun.file(`./src/recital_order.sql`).text()
    )
    .all()
    .map(d => ({
      ...d,
      dancers: JSON.parse(d.dancers as unknown as string),
    }));

const moveDance = db.transaction((base_dance_id: number, direction: 'up' | 'down' | number) => {
  let dance_id = base_dance_id;

  const selectDance = db.prepare<Dance, SQLQueryBindings>(
    `SELECT * FROM dances WHERE id = :dance_id`
  );
  const danceRecord = selectDance.get({ ':dance_id': base_dance_id });

  if (!danceRecord) {
    console.log(`Dance ${base_dance_id} not found.`);
    return;
  }
  console.log('This dance:', danceRecord);

  if (!danceRecord.recital_group && typeof direction === 'number') {
    // const moveBabyDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
    //   `UPDATE recital_group_orders AS rgo_update SET follows_dance_id = COALESCE((${
    //     direction === 'up'
    //       ? 'SELECT follows_dance_id FROM recital_group_orders rgo_select WHERE rgo_select.dance_id = rgo_update.follows_dance_id'
    //       : 'SELECT dance_id FROM recital_group_orders rgo_select WHERE rgo_select.follows_dance_id = rgo_update.follows_dance_id AND dance_id <> :dance_id'
    //   }), rgo_update.follows_dance_id) WHERE dance_id = :dance_id RETURNING *`
    // );
    const moveBabyDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `UPDATE recital_group_orders SET follows_dance_id = :follows_dance_id WHERE dance_id = :dance_id RETURNING *`
    );
    console.log(
      `Moving baby dance ${base_dance_id} ${direction}.`,
      moveBabyDance.all({ ':dance_id': base_dance_id, ':follows_dance_id': direction })
    );
    return;
  }

  if (direction === 'up') {
    // Check if there actually is a preceding dance to move above
    const selectPrevDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `SELECT dance_id FROM recital_group_orders WHERE dance_id = (SELECT follows_dance_id FROM recital_group_orders WHERE dance_id = :dance_id)`
    );
    const prevDanceRecord = selectPrevDance.get({ ':dance_id': base_dance_id });
    if (!prevDanceRecord) {
      console.log('Attempted to move first dance in group up in the order.');
      return;
    }
    dance_id = prevDanceRecord.dance_id;
  } else if (direction === 'down') {
    // Check if there actually is a next dance to move below
    const selectNextDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `SELECT dance_id FROM recital_group_orders WHERE follows_dance_id = :dance_id`
    );
    if (!selectNextDance.get({ ':dance_id': base_dance_id })) {
      console.log('Attempted to move last dance in group down in the order.');
      return;
    }
  } else {
    // This can happen if we send a baby dance ID with a null direction
    console.log('Attempted to move baby dance following a null ID.');
    return;
  }

  {
    const selectPrecedingDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `SELECT follows_dance_id FROM recital_group_orders WHERE dance_id = :dance_id`
    );
    const { follows_dance_id: preceding_dance_id } = selectPrecedingDance.get({
      ':dance_id': dance_id,
    }) ?? {
      follows_dance_id: null,
    };

    const selectFollowingDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `SELECT dance_id FROM recital_group_orders WHERE follows_dance_id = (SELECT dance_id FROM recital_group_orders WHERE follows_dance_id = :dance_id)`
    );
    const { dance_id: following_dance_id } = selectFollowingDance.get({
      ':dance_id': dance_id,
    }) ?? { dance_id: null };
    console.log({ preceding_dance_id, dance_id, following_dance_id });

    const updateThisDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `UPDATE recital_group_orders SET follows_dance_id = (SELECT dance_id FROM recital_group_orders rgo_next_dance WHERE rgo_next_dance.follows_dance_id = :dance_id) WHERE dance_id = :dance_id RETURNING *`
    );
    const updateNextDance = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `UPDATE recital_group_orders SET follows_dance_id = :preceding_dance_id WHERE dance_id = (SELECT follows_dance_id FROM recital_group_orders rgo_this_dance WHERE rgo_this_dance.dance_id = :dance_id) RETURNING *`
    );
    const updateDanceAfterThat = db.prepare<RecitalGroupOrder, SQLQueryBindings>(
      `UPDATE recital_group_orders SET follows_dance_id = :dance_id WHERE dance_id = :following_dance_id RETURNING *`
    );
    console.log('Updating this dance', updateThisDance.all({ ':dance_id': dance_id }));
    console.log(
      'Updating next dance',
      updateNextDance.all({
        ':dance_id': dance_id,
        ':preceding_dance_id': preceding_dance_id,
      })
    );
    console.log(
      'Updating dance after that',
      updateDanceAfterThat.all({
        ':dance_id': dance_id,
        ':following_dance_id': following_dance_id,
      })
    );
  }
});

const rebuildApp = async () => {
  await Bun.build({
    entrypoints: ['src/index.html'],
    outdir: './build',
  });
  const indexHtml = Bun.file('./build/index.html');
  await Bun.write(
    indexHtml,
    (
      await indexHtml.text()
    ).replace('__INITIAL_DATA__', JSON.stringify(await getRecitalOrderData()))
  );
};

const server = Bun.serve({
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // Root
    if (path === '/') {
      await rebuildApp();
      return new Response(await Bun.file('./build/index.html').text(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Static files
    if (path.endsWith('.css'))
      return new Response(await Bun.file(`./build/${path}`).text(), {
        headers: { 'Content-Type': 'text/css' },
      });
    if (path.endsWith('.js'))
      return new Response(await Bun.file(`./build/${path}`).text(), {
        headers: { 'Content-Type': 'text/javascript' },
      });
    if (path.endsWith('.html'))
      return new Response(await Bun.file(`./build/${path}`).text(), {
        headers: { 'Content-Type': 'text/html' },
      });

    if (path === '/api/data') return Response.json(await getRecitalOrderData());

    if (req.method === 'POST' && path === '/api/sort') {
      const data = await req.json();
      console.log('Received JSON:', data);
      moveDance(...data);
      return Response.json({ success: true, data });
    }

    // receive POST data from a form
    // if (req.method === 'POST' && path === '/form') {
    //   const data = await req.formData();
    //   console.log(data.get('someField'));
    //   return new Response('Success');
    // }

    // 404s
    return new Response('Page not found', { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
