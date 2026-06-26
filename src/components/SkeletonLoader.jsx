export default function SkeletonLoader({ type = 'card-grid', count = 4 }) {
  if (type === 'hero') {
    return (
      <div className="w-full h-screen min-h-[550px] bg-surface-container animate-pulse flex items-end">
        <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-[80px] md:pb-[120px] flex gap-gutter">
          <div className="w-[300px] aspect-[2/3] bg-surface-container-high rounded-lg hidden md:block shrink-0"></div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-16 bg-surface-container-high rounded-md w-3/4"></div>
            <div className="h-6 bg-surface-container-high rounded-md w-1/2"></div>
            <div className="h-20 bg-surface-container-high rounded-md w-full"></div>
            <div className="flex gap-4">
              <div className="h-12 bg-surface-container-high rounded-full w-40"></div>
              <div className="h-12 bg-surface-container-high rounded-full w-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'row') {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="h-8 bg-surface-container-high rounded w-48 animate-pulse"></div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="flex-none w-[140px] md:w-[200px] flex flex-col gap-3 animate-pulse">
              <div className="aspect-[2/3] w-full bg-surface-container rounded-lg"></div>
              <div className="h-5 bg-surface-container rounded w-3/4"></div>
              <div className="h-4 bg-surface-container rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'card-grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-gutter w-full">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex flex-col gap-3 animate-pulse">
            <div className="aspect-[2/3] w-full bg-surface-container rounded-lg"></div>
            <div className="h-5 bg-surface-container rounded w-3/4"></div>
            <div className="h-4 bg-surface-container rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg flex flex-col gap-8 animate-pulse mt-24">
        <div className="h-[400px] bg-surface-container rounded-xl w-full"></div>
        <div className="flex flex-col lg:flex-row gap-gutter">
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-8 bg-surface-container rounded w-40"></div>
            <div className="h-20 bg-surface-container rounded w-full"></div>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <div className="h-8 bg-surface-container rounded w-40"></div>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-full bg-surface-container"></div>
              <div className="w-24 h-24 rounded-full bg-surface-container"></div>
              <div className="w-24 h-24 rounded-full bg-surface-container"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
