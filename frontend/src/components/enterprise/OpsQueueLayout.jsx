/**
 * Mobile-first queue + detail split for operational dashboards.
 */
const OpsQueueLayout = ({ queue, detail, pulsing = false }) => (
  <div
    className={`grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 transition-opacity duration-300 ${
      pulsing ? 'opacity-95' : 'opacity-100'
    }`}
  >
    <div className="lg:col-span-4 xl:col-span-3">
      <div className="ops-glass rounded-2xl border border-slate-800/80 p-3 sm:p-4 max-h-[50vh] lg:max-h-[calc(100vh-14rem)] overflow-y-auto">
        <div className="flex md:hidden overflow-x-auto gap-2 pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {queue}
        </div>
        <div className="hidden md:block space-y-2">{queue}</div>
      </div>
    </div>
    <div className="lg:col-span-8 xl:col-span-9 space-y-4 min-h-[20rem]">{detail}</div>
  </div>
);

export default OpsQueueLayout;
