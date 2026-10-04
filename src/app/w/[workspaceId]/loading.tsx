export default function WorkspaceLoading() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-40 animate-pulse rounded-2xl bg-white/80" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sheet h-28 animate-pulse" />
        <div className="sheet h-28 animate-pulse" />
        <div className="sheet h-28 animate-pulse" />
        <div className="sheet h-28 animate-pulse" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="sheet h-64 animate-pulse" />
        <div className="sheet h-64 animate-pulse" />
      </div>
    </div>
  );
}
