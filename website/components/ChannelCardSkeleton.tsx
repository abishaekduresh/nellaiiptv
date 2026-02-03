export default function ChannelCardSkeleton() {
  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="aspect-video bg-slate-800 relative">
        <div className="absolute top-2 right-2 w-10 h-4 bg-slate-700 rounded" />
      </div>
      
      {/* Info Skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-700 rounded w-1/4" />
        </div>
      </div>
      
      {/* Footer Skeleton */}
       <div className="flex items-center justify-between mt-1 px-3 pb-3">
          <div className="h-3 bg-slate-700 rounded w-8" />
          <div className="h-3 bg-slate-700 rounded w-12" />
       </div>
    </div>
  );
}
