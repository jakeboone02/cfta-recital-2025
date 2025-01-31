import { Database } from 'bun:sqlite';

const db_file_path = `${import.meta.dir}/database.db`;

const db_file = Bun.file(db_file_path);

if (await db_file.exists()) {
  await db_file.delete();
}

const db = new Database(db_file_path);

const statements = (await Bun.file(`${import.meta.dir}/create_database.sql`).text())
  .split('\n')
  .filter(s => s.trim().length > 0 && !s.trim().startsWith('--'))
  .join('\n')
  .split(/;[\r\n]+/g)
  .filter(s => s.trim().startsWith('CREATE') || s.trim().startsWith('INSERT'));

await db.transaction(() => {
  for (const sql of statements) {
    console.log(sql.split('\n').join(''));
    console.log(JSON.stringify(db.run(sql)));
  }
})();

// Test query: Dancers with multiple dances in the same group
console.log(
  db
    .query(
      `
  SELECT recital_group, dancer, group_concat(dance, '|') dance_list, count(*) dance_dancer_count
    FROM dances INNER JOIN dance_dancers ON dances.id = dance_id
   WHERE recital_group IN (1, 2, 3)
     AND dance NOT LIKE '%TAP'
   GROUP BY recital_group, dancer
  HAVING dance_dancer_count > 1
  ORDER BY dance_dancer_count DESC, recital_group ASC, dancer ASC`
    )
    .all()
    .map(
      r =>
        // @ts-ignore
        `${r.dance_dancer_count} dances in group ${r.recital_group}:  ${r.dancer}  (${r.dance_list
          .split('|')
          // @ts-ignore
          .map(d => `[${d}]`)
          .join(', ')})`
    )
    .join('\n')
);

db.close();
