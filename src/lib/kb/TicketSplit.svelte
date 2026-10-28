<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // One ticket per problem, counted with the desk's own view (CauseTable): one report per id, placed by
  // tenant and channel. Reports the desk read as a one-day move stay counted in the row they are filed in,
  // and get a ticket of their own as well.
  let { ticket, tickets }: { ticket: number; tickets: { parser: number; hint: number; shift: number } } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const count = (cause: string) => groups.find((g) => g.cause === cause)?.reports.length ?? 0;
  const moved = $derived(groups.reduce((n, g) => n + readAs(g, notes.oneDayMove), 0));
  const rows = $derived([
    { problem: 'dates read month first', from: 'parser', reports: count('parser'), to: `#${tickets.parser}` },
    { problem: 'booking-v3 hint asks for the month first', from: 'hint', reports: count('hint'), to: `#${tickets.hint}` },
    { problem: 'one-day move', from: 'parser, read as a one-day move', reports: moved, to: `#${tickets.shift}` },
  ]);
</script>

<table>
  <thead>
    <tr><th>problem</th><th>desk row</th><th>reports</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each rows as r (r.from)}
      <tr>
        <td>{r.problem}</td>
        <td><code>{r.from}</code></td>
        <td>{r.reports}</td>
        <td>{r.to}</td>
      </tr>
    {/each}
  </tbody>
</table>
