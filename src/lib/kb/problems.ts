// What a ticket's reports turn out to be, once the desk's own reading is counted and not footnoted.
// causes.ts places a report by tenant and channel; desk-notes.json says which ones the desk read differently.
import { causeOf, groupByCause, type CauseGroup, type Report, type Tenant } from '#lib/kb/causes';

// `parser` takes causes.ts's `hint` too. booking-v3 tells people to type month first and the parser reads
// month first, so the hint alone cannot flip a date: those reports show the same flip as every other one.
// `shift`: the booking lands one day off. No day/month swap does that: a swap keeps the date or moves it to
// another month. So these are not `parser`, whatever their tenant.
export type Problem = 'parser' | 'shift' | 'unplaced';

export type ProblemGroup = Omit<CauseGroup, 'cause'> & {
  problem: Problem;
  // How these reports came in: channel → count.
  channels: Record<string, number>;
};

export function problemOf(r: Report, t: Tenant | undefined, shiftIds: readonly string[]): Problem {
  if (shiftIds.includes(r.id)) return 'shift';
  return causeOf(r, t) === null ? 'unplaced' : 'parser';
}

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
  const byProblem = new Map<Problem, Report[]>();
  for (const r of reports) {
    const problem = problemOf(r, tenantOf(r), shiftIds);
    byProblem.set(problem, [...(byProblem.get(problem) ?? []), r]);
  }
  // A tenant-less pass puts each problem's reports in one group; only its tallies are kept.
  return [...byProblem.entries()]
    .map(([problem, rs]) => withChannels(problem, groupByCause(rs, () => undefined)[0]))
    .sort((a, b) => b.reports.length - a.reports.length);
}
