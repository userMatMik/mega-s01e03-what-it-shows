<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { groupByCause, readAs, uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // Where each of the desk's rows goes once #4471 is split. Counts come from the desk's own view
  // (CauseTable); the reports it read as a one-day move leave their row for a ticket of their own.
  let { ticket, tickets }: { ticket: number; tickets: { flip: number; shift: number } } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByCause(merged, tenantOf));
  const count = (cause: string) => groups.find((g) => g.cause === cause)?.reports.length ?? 0;
  const moved = $derived(groups.reduce((n, g) => n + readAs(g, notes.oneDayMove), 0));
  const rows = $derived([
    { problem: 'day/month flip', from: 'parser, without the one-day moves', reports: count('parser') - moved, to: `#${tickets.flip}` },
    { problem: 'day/month flip', from: 'hint', reports: count('hint'), to: `duplicate of #${tickets.flip}, counted in its own row` },
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
