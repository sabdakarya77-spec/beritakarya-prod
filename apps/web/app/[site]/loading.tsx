import { Container } from '../../components/layout/Container';
import Skeleton from '../../components/ui/Skeleton';

export default function Loading() {
  return (
    <Container className="py-8">
      {/* Hero Skeleton */}
      <section className="mb-16 animate-pulse">
        <Skeleton variant="hero" />
      </section>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
        {/* Main Feed Skeletons */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          <Skeleton variant="text" className="h-10 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        </div>

        {/* Sidebar Skeletons */}
        <aside className="lg:col-span-4 flex flex-col gap-12">
          <div className="p-6 bg-brand-surface dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-sm overflow-hidden relative">
            <Skeleton variant="text" className="h-4 w-24 mb-6" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="text" className="h-10" />
              ))}
            </div>
          </div>

          <div>
            <Skeleton variant="text" className="h-6 w-32 mb-6" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="minimal" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
