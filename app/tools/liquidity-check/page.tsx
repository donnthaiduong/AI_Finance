import type { Metadata } from 'next';
import Workspace from '../../treasury-workspace';

export const metadata: Metadata = {
  title: 'Liquidity Check',
  description: 'Test whether your cash covers essential payments for 30 days if access to one bank is interrupted.',
};

export default function Page() { return <Workspace />; }
