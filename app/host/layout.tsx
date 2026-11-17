import type { ReactNode } from 'react';
import { noIndexMetadata } from '@/lib/noIndexMetadata';

export const metadata = noIndexMetadata;

export default function HostLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
