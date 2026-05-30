import StreamInfraSubNav from './StreamInfraSubNav';

export default function StreamInfraLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-6 items-start">
      <StreamInfraSubNav />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
