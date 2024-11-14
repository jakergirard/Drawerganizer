import { DrawerGrid } from '@/components/drawer-grid';
import { Settings } from '@/components/settings';

export default function Home() {
  return (
    <main className="relative">
      <div className="absolute top-4 right-4">
        <Settings />
      </div>
      <DrawerGrid />
    </main>
  );
}
