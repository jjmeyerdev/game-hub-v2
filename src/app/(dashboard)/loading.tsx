export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-48 bg-border rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-32 bg-theme-hover rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-theme-secondary border border-theme rounded-xl p-6">
            <div className="h-4 w-20 bg-border rounded animate-pulse mb-3" />
            <div className="h-8 w-16 bg-theme-hover rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-theme-secondary border border-theme rounded-xl overflow-hidden">
            <div className="aspect-3/4 bg-theme-hover animate-pulse" />
            <div className="p-4">
              <div className="h-4 w-3/4 bg-border rounded animate-pulse mb-2" />
              <div className="h-3 w-1/2 bg-theme-hover rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
