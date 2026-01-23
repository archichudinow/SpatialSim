/**
 * TimelineToggle
 * Toggle button for showing/hiding 3D event visualization in viewport
 */
import { useInsightsStore } from '../../insightsStore';

export function TimelineToggle() {
  const showVisualization = useInsightsStore(s => s.showInsightsVisualization);
  const setShowVisualization = useInsightsStore(s => s.setShowInsightsVisualization);
  
  return (
    <button
      onClick={() => setShowVisualization(!showVisualization)}
      title={showVisualization ? "Hide event points in 3D viewport" : "Show event points in 3D viewport"}
      className={`
        w-full py-1.5 px-2 rounded-sm cursor-pointer text-sm font-mono transition-all flex items-center justify-center gap-1.5
        ${ showVisualization
          ? 'bg-accent-blue/30 border border-border-active text-text-accent font-bold hover:bg-accent-blue/25'
          : 'bg-bg-hover border border-border text-text-primary hover:bg-accent-blue/25 hover:border-border-active'
        }
      `}
    >
      <span>{showVisualization ? '👁️' : '👁️‍🗨️'}</span>
      <span>{showVisualization ? 'Hide 3D Event Points' : 'Show 3D Event Points'}</span>
    </button>
  );
}
