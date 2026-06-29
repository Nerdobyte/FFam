import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { getVotingSettings, setDrawEnabled } from '@/lib/voting-settings';

export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getVotingSettings();
  return NextResponse.json({
    drawEnabled: settings.drawEnabled,
    drawDisabled: !settings.drawEnabled,
  });
}

export async function POST(request: Request) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const drawDisabled = body?.drawDisabled as boolean | undefined;

  if (typeof drawDisabled !== 'boolean') {
    return NextResponse.json({ error: 'drawDisabled boolean is required' }, { status: 400 });
  }

  await setDrawEnabled(!drawDisabled);

  return NextResponse.json({
    ok: true,
    drawEnabled: !drawDisabled,
    drawDisabled,
  });
}
