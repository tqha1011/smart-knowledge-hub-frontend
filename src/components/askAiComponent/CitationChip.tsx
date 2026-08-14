interface CitationChipProps {
  number: number;
}

// Numbered amber citation marker — the signature UI element for the RAG
// Assistant per spec: the same chip renders inline within an answer's text
// (at the exact claim it supports) and again in the sources list below,
// functioning like an academic footnote.
export function CitationChip({ number }: CitationChipProps) {
  return (
    <span className="bg-citation-bg text-citation-fg mx-0.5 inline-flex size-4 items-center justify-center rounded-full align-text-top font-mono text-[10px] font-semibold">
      {number}
    </span>
  );
}
