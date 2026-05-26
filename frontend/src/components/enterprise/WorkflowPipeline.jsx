import { Check } from 'lucide-react';
import { VISUAL_PIPELINE, getPipelineProgress } from '@shared/constants/workflow-pipeline.js';

const WorkflowPipeline = ({ workflowState, compact = false }) => {
  const { currentIndex, completedThrough } = getPipelineProgress(workflowState);

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-1 touch-pan-x">
        {VISUAL_PIPELINE.map((step, idx) => {
          const done = idx <= completedThrough;
          const active = idx === currentIndex;
          return (
            <div key={step.key} className="flex items-center shrink-0">
              <div
                className={`h-1.5 w-6 sm:w-10 rounded-full transition-all duration-500 ${
                  done ? 'bg-emerald-500' : active ? 'bg-cyan-400 animate-pulse-live' : 'bg-slate-700'
                }`}
                title={step.label}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="ops-glass rounded-2xl p-4 border border-slate-800/80">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Care pathway</p>
      <div className="hidden md:flex items-center justify-between gap-1">
        {VISUAL_PIPELINE.map((step, idx) => {
          const done = idx < currentIndex || (idx === currentIndex && workflowState === 'DISCHARGED');
          const active = idx === currentIndex && workflowState !== 'DISCHARGED';
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  done
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : active
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 scale-110'
                      : 'bg-slate-900 border-slate-700 text-slate-600'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <p className={`text-[9px] mt-1 truncate w-full text-center ${active ? 'text-cyan-300 font-semibold' : 'text-slate-500'}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
      <div className="md:hidden mt-2">
        <WorkflowPipeline workflowState={workflowState} compact />
        <p className="text-xs text-cyan-300 mt-2 font-medium text-center">
          {VISUAL_PIPELINE[currentIndex]?.label} · {workflowState?.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  );
};

export default WorkflowPipeline;
