import {
  INCIDENT_TYPE_LABELS,
  incidentSinceLabel,
  PLATFORM_STATUS_LABELS,
  PLATFORM_STATUS_SUMMARIES,
  platformServiceLabel,
  type Incident,
  type PlatformStatusResponse,
} from "@discordia/client-shared";

import { cn } from "@/lib/cn";

import { STATUS_TONES } from "./utils/statusTone";

export function PlatformStatusDetails({
  status,
  incidents,
}: PlatformStatusResponse) {
  const tone = STATUS_TONES[status];
  const Icon = tone.icon;
  const showIncidents = incidents.length > 0 || status !== "operational";

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "flex items-start gap-4 rounded-2xl border p-4 sm:p-5",
          tone.panel,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            tone.soft,
          )}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <h3 className="text-content font-display text-lg leading-tight font-bold">
            {PLATFORM_STATUS_LABELS[status]}
          </h3>
          <p className="text-content-muted mt-1 text-sm leading-relaxed">
            {PLATFORM_STATUS_SUMMARIES[status]}
          </p>
        </div>
      </div>

      {showIncidents ? (
        <section aria-labelledby="active-incidents-heading">
          <div className="mb-3 flex items-center gap-2">
            <h3
              id="active-incidents-heading"
              className="text-content-subtle font-display text-xs font-semibold tracking-wide uppercase"
            >
              Incidentes activos
            </h3>
            <span className="bg-surface-input text-content-muted rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums">
              {incidents.length}
            </span>
          </div>
          {incidents.length === 0 ? (
            <p className="border-line text-content-subtle rounded-2xl border border-dashed px-4 py-8 text-center text-sm">
              No hay incidentes en este momento.
            </p>
          ) : (
            <ul className="space-y-3">
              {incidents.map((incident) => (
                <li key={incident.id}>
                  <IncidentItem incident={incident} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function IncidentItem({ incident }: { incident: Incident }) {
  const tone = STATUS_TONES[incident.platform_status];
  const services = incident.affected_services.map(platformServiceLabel);

  return (
    <article className="bg-surface-raised border-line relative overflow-hidden rounded-2xl border px-4 py-3.5 pl-5 sm:px-5 sm:pl-6">
      <span
        aria-hidden
        className={cn("absolute inset-y-0 left-0 w-1", tone.accent)}
      />
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-content font-display min-w-0 font-semibold break-words">
          {incident.title}
        </h4>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
            tone.soft,
          )}
        >
          {INCIDENT_TYPE_LABELS[incident.platform_status]}
        </span>
      </div>
      {incident.description ? (
        <p className="text-content-muted mt-1.5 text-sm leading-relaxed break-words whitespace-pre-line">
          {incident.description}
        </p>
      ) : null}
      <p className="text-content-subtle mt-3 text-xs">
        {services.length > 0 ? `Afecta a ${services.join(", ")} · ` : null}
        <time dateTime={incident.created_at}>
          {incidentSinceLabel(incident.created_at)}
        </time>
      </p>
    </article>
  );
}
