// A small animated example of a task, drawn with the stage's own drawing code.
import { useEffect, useRef } from "react";
import type { TaskName } from "../app/types";
import { animate, Preview } from "../stage/preview";
import { getStage } from "../stage/stage";

interface StimulusPreviewProps {
  kind: TaskName;
  /** Fixed per preview, so an example always looks the same. */
  seed: number;
  playing?: boolean;
  label: string;
  id?: string;
}

export function StimulusPreview({ kind, seed, playing = true, label, id }: StimulusPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<Preview | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preview = new Preview(canvas, kind, seed);
    previewRef.current = preview;
    preview.build();
    const stop = animate(preview);
    // Rebuild at the new size, but not while the stage is up: its resize mustn't cost a trial frames.
    const ro = new ResizeObserver(() => { if (!getStage().open) preview.build(); });
    ro.observe(canvas);
    return () => { stop(); ro.disconnect(); previewRef.current = null; };
  }, [kind, seed]);

  useEffect(() => { if (previewRef.current) previewRef.current.playing = playing; }, [playing]);

  return <canvas ref={canvasRef} id={id} className="stim-canvas" aria-label={label} />;
}
