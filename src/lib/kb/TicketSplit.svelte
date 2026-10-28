<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { causeOf, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // Where each of the desk's rows goes once #4471 is split. Reports are placed the desk's way (causes.ts)
  // and counted as exported: every row, a report exported twice included. The one-day moves leave their row
  // for a ticket of their own.
  let { ticket, tickets }: { ticket: number; tickets: { flip: number; shift: number } } = $props();

  const merged = $derived((reports as Report[]).filter((r) => r.mergedInto === ticket));
  const moved = (r: Report) => notes.oneDayMove.includes(r.id);
  const pick = (test: (r: Report) => boolean) => {
    const rs = merged.filter(test);
    return { rows: rs.length, ids: new Set(rs.map((r) => r.id)).size };
  };
  const rows = $derived([
    { problem: 'day/month flip', from: 'parser, without the one-day moves', ...pick((r) => causeOf(r, tenantOf(r)) === 'parser' && !moved(r)), to: `#${tickets.flip}` },
    { problem: 'day/month flip', from: 'hint', ...pick((r) => causeOf(r, tenantOf(r)) === 'hint'), to: `duplicate of #${tickets.flip}, counted in its own row` },
    { problem: 'one-day move', from: 'parser, read as a one-day move', ...pick(moved), to: `#${tickets.shift}` },
  ]);
</script>

<table>
  <thead>
    <tr><th>problem</th><th>desk row</th><th>reports (rows as exported)</th><th>report ids</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.from)}
      <tr>
        <td>{r.problem}</td>
        <td><code>{r.from}</code></td>
        <td>{r.rows}</td>
        <td>{r.ids}</td>
        <td>{r.to}</td>
      </tr>
    {/each}
  </tbody>
</table>
