'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';

const getPageTitle = (pathname: string): string => {
  if (pathname === '/ai-workbench') {
    return 'AI Workbench';
  }
  if (pathname === '/metric-analysis/price') {
    return 'Price Analysis';
  }
  if (pathname === '/metric-analysis/sopr') {
    return 'SOPR';
  }
  if (pathname === '/metric-analysis/mvrv-delta-gradient') {
    return 'MVRV Delta Gradient';
  }
  if (pathname === '/metric-analysis') {
    return 'Metric Analysis';
  }
  return 'ClarionChain';
};

export default function TopBar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <div className="relative w-full h-16 bg-black flex items-center justify-between px-6 border-b border-white/20 z-50 flex-none">
      <div className="flex flex-row items-center gap-3">
        <Image
          src="/clarion_chain_logo.png"
          alt="ClarionChain Logo"
          width={32}
          height={32}
          className="rounded"
        />
        <span className="text-lg font-bold tracking-wide">ClarionChain</span>
      </div>
      <div className="flex-1 flex justify-center">
        <h1 className="text-3xl font-bold">{pageTitle}</h1>
      </div>
      <div className="w-[200px]"></div> {/* Spacer for balance */}
    </div>
  );
}
