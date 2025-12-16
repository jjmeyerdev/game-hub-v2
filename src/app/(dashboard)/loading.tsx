export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-steel/20 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-32 bg-steel/10 rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-deep/50 border border-steel/30 rounded-xl p-6">
            <div className="h-4 w-20 bg-steel/20 rounded animate-pulse mb-3" />
            <div className="h-8 w-16 bg-steel/30 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-deep/50 border border-steel/30 rounded-xl overflow-hidden">
            <div className="aspect-[3/4] bg-steel/10 animate-pulse" />
            <div className="p-4">
              <div className="h-4 w-3/4 bg-steel/20 rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-steel/10 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
