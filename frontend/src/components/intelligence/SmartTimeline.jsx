import { useState, useEffect } from 'react';
import { Pin, ChevronDown, ChevronUp, FolderOpen, Clock } from 'lucide-react';
import api from '../../api/axios';

const SmartTimeline = ({
  patientId,
  refreshKey = 0,
  hospitalFilter = 'all',
  dark = false,
  groupByVisit = false,
}) => {
  const [data, setData] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    api
      .get(`/intelligence/patient/${patientId}/timeline-smart`)
      .then(({ data: d }) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [patientId, refreshKey]);

  const filterEvents = (events) =>
    hospitalFilter === 'all'
      ? events
      : events.filter((ev) => !ev.hospital || ev.hospital === hospitalFilter);

  const groups = (data?.groups || [])
    .map((g) => ({
      ...g,
      events: filterEvents(g.events),
    }))
    .filter((g) => g.events.length > 0);

  const visitFolders = (data?.visitFolders || [])
    .map((f) => ({
      ...f,
      events: filterEvents(f.events),
    }))
    .filter((f) => f.events.length > 0);

  const sk = dark
    ? {
        pulse: 'bg-slate-800 rounded-xl',
        empty: 'text-slate-500',
        summary: 'text-sm text-cyan-200/90 bg-cyan-950/40 border border-cyan-900/50 rounded-xl px-4 py-3',
        pinLabel: 'text-xs font-bold text-amber-500/90 uppercase',
        pinCard: 'bg-amber-950/40 border border-amber-900/50 rounded-lg px-3 py-2 text-sm text-amber-100',
        hospital: 'text-xs text-cyan-400 font-semibold block',
        group: 'border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50',
        groupHover: 'hover:bg-slate-800/80',
        title: 'font-semibold text-slate-100',
        meta: 'text-xs text-slate-500',
        chevron: 'text-slate-400',
        item: 'px-4 py-2 text-slate-300',
        itemMeta: 'text-xs text-slate-600',
        divider: 'border-t border-slate-800 divide-y divide-slate-800',
        visitFolder: 'border border-slate-700 rounded-2xl overflow-hidden bg-slate-900/40',
      }
    : {
        pulse: 'bg-slate-100 rounded-xl',
        empty: 'text-slate-500',
        summary: 'text-sm text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3',
        pinLabel: 'text-xs font-bold text-slate-500 uppercase',
        pinCard: 'bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-sm',
        hospital: 'text-xs text-blue-600 font-semibold block',
        group: 'border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm',
        groupHover: 'hover:bg-slate-50',
        title: 'font-semibold text-slate-800',
        meta: 'text-xs text-slate-500',
        chevron: 'text-slate-600',
        item: 'px-5 py-3',
        itemMeta: 'text-xs text-slate-500',
        divider: 'border-t border-slate-100 divide-y divide-slate-100',
        visitFolder: 'border border-blue-100 rounded-2xl overflow-hidden bg-white shadow-sm',
      };

  if (loading) return <div className={`animate-pulse h-40 ${sk.pulse}`} />;

  const hasContent = groupByVisit ? visitFolders.length > 0 : groups.length > 0;
  if (!hasContent) {
    return <p className={`text-sm text-center py-10 ${sk.empty}`}>No care history yet. Visits will appear here as folders.</p>;
  }

  return (
    <div className="space-y-6">
      {data.compressedSummary && <p className={sk.summary}>{data.compressedSummary}</p>}

      {data.pinnedEvents?.length > 0 && (
        <div className="space-y-3">
          <p className={`${sk.pinLabel} flex items-center gap-1`}>
            <Pin className="w-3 h-3" /> Critical history
          </p>
          {data.pinnedEvents.map((ev) => (
            <div key={ev.id} className={sk.pinCard}>
              {ev.hospital && <span className={sk.hospital}>{ev.hospital}</span>}
              <span className="font-medium text-slate-800">{ev.displayTitle || ev.title}</span>
            </div>
          ))}
        </div>
      )}

      {groupByVisit && visitFolders.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> Hospital visits
          </p>
          {visitFolders.map((folder) => {
            const open = expandedVisit === folder.visitId;
            return (
              <div key={folder.visitId} className={sk.visitFolder}>
                <button
                  type="button"
                  className={`w-full flex justify-between items-center px-5 py-4 text-left ${sk.groupHover}`}
                  onClick={() => setExpandedVisit(open ? null : folder.visitId)}
                >
                  <div>
                    <p className={sk.title}>
                      {folder.summary}
                      {folder.closed && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md align-middle">
                          Completed
                        </span>
                      )}
                    </p>
                    <p className={`${sk.meta} mt-1 flex flex-wrap items-center gap-2`}>
                      {folder.hospital && <span>{folder.hospital}</span>}
                      {folder.branch && <span>· {folder.branch}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(folder.startedAt).toLocaleDateString()}
                        {folder.closedAt ? ` — closed ${new Date(folder.closedAt).toLocaleDateString()}` : ''}
                        {' · '}
                        {folder.count} actions
                      </span>
                    </p>
                  </div>
                  {open ? <ChevronUp className={`w-5 h-5 ${sk.chevron}`} /> : <ChevronDown className={`w-5 h-5 ${sk.chevron}`} />}
                </button>
                {open && (
                  <ul className={`${sk.divider} text-sm max-h-64 overflow-y-auto`}>
                    {folder.events.map((ev) => (
                      <li key={`${folder.visitId}-${ev.id}`} className={sk.item}>
                        <p className="font-medium text-slate-800">{ev.displayTitle || ev.title}</p>
                        <p className={sk.itemMeta}>{new Date(ev.date).toLocaleString()}</p>
                        {ev.summary && <p className="text-xs text-slate-500 mt-1">{ev.summary}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!groupByVisit && (
        <div className="space-y-3">
          {groups.map((g) => {
            const open = expandedGroup === g.type;
            const severity = g.pinned ? 'border-l-4 border-l-amber-400' : '';
            return (
              <div key={g.type} className={`${sk.group} ${severity}`}>
                <button
                  type="button"
                  className={`w-full flex justify-between items-center px-5 py-4 text-left ${sk.groupHover}`}
                  onClick={() => setExpandedGroup(open ? null : g.type)}
                >
                  <div>
                    <p className={sk.title}>
                      {g.summary}
                      <span className="ml-2 text-[10px] opacity-60">({g.count})</span>
                    </p>
                    <p className={sk.meta}>
                      {g.hospital && `${g.hospital} · `}
                      {new Date(g.latestAt).toLocaleDateString()}
                    </p>
                  </div>
                  {open ? <ChevronUp className={`w-5 h-5 ${sk.chevron}`} /> : <ChevronDown className={`w-5 h-5 ${sk.chevron}`} />}
                </button>
                {open && (
                  <ul className={`${sk.divider} text-sm max-h-52 overflow-y-auto`}>
                    {g.events.map((ev) => (
                      <li key={ev.id} className={sk.item}>
                        <p className="font-medium">{ev.displayTitle || ev.title}</p>
                        <p className={sk.itemMeta}>{new Date(ev.date).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SmartTimeline;
