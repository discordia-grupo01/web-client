import {
  activeIncidentsLabel,
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

  return (
    <div className="space-y-6">
      <section
        className={cn(
          "flex items-start gap-3 rounded-xl border px-4 py-3",
          tone.surface,
        )}
      >
        <Icon
          size={18}
          className={cn("mt-0.5 shrink-0", tone.text)}
          aria-hidden
        />
        <div className="min-w-0">
          <p className={cn("font-display text-base font-bold", tone.text)}>
            {PLATFORM_STATUS_LABELS[status]}
          </p>
          <p className="text-content-muted mt-0.5 text-sm">
            {PLATFORM_STATUS_SUMMARIES[status]}
          </p>
        </div>
      </section>

      <section aria-labelledby="active-incidents-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3
            id="active-incidents-heading"
            className="text-content font-display text-sm font-semibold"
          >
            Incidentes activos
          </h3>
          <span className="text-content-subtle text-xs">
            {activeIncidentsLabel(incidents.length)}
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
    </div>
  );
}

function IncidentItem({ incident }: { incident: Incident }) {
  const tone = STATUS_TONES[incident.platform_status];

  return (
    <article className="bg-surface-raised border-line rounded-2xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h4 className="text-content font-display font-semibold break-words">
          {incident.title}
        </h4>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            tone.chip,
          )}
        >
          {INCIDENT_TYPE_LABELS[incident.platform_status]}
        </span>
        <time
          dateTime={incident.created_at}
          className="text-content-subtle ml-auto text-xs"
        >
          {incidentSinceLabel(incident.created_at)}
        </time>
      </div>
      <p className="text-content-muted mt-2 text-sm leading-relaxed break-words whitespace-pre-line">
        {incident.description}
      </p>
      {incident.affected_services.length > 0 ? (
        <ul
          className="mt-3 flex flex-wrap gap-2"
          aria-label="Servicios afectados"
        >
          {incident.affected_services.map((service) => (
            <li
              key={service}
              className="bg-surface-input border-line text-content-muted rounded-md border px-2 py-1 text-xs"
            >
              {platformServiceLabel(service)}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
