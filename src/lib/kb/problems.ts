// What a ticket's reports turn out to be, once the desk's own reading is counted and not footnoted.
// causes.ts places a report by tenant and channel; desk-notes.json says which ones the desk read differently.
import { groupByCause, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

// `shift`: the booking lands one day off. No day/month swap does that: a swap keeps the date or moves it to
// another month. So these are not `parser`, whatever their tenant.
export type Problem = CauseGroup['cause'] | 'shift';

export type ProblemGroup = Omit<CauseGroup, 'cause'> & {
  problem: Problem;
  // How these reports came in: channel → count.
  channels: Record<string, number>;
};

const withChannels = (problem: Problem, g: CauseGroup): ProblemGroup => {
  const { cause: _, ...rest } = g;
  return {
    problem,
    ...rest,
    channels: g.reports.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
  };
};

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  shiftIds: readonly string[],
): ProblemGroup[] {
  const shifted = reports.filter((r) => shiftIds.includes(r.id));
  const rest = reports.filter((r) => !shiftIds.includes(r.id));
  // A tenant-less pass puts every shifted report in one group; only its tallies are kept.
  const shiftGroups = shifted.length ? [withChannels('shift', groupByCause(shifted, () => undefined)[0])] : [];
  return [...groupByCause(rest, tenantOf).map((g) => withChannels(g.cause, g)), ...shiftGroups].sort(
    (a, b) => b.reports.length - a.reports.length,
  );
}
