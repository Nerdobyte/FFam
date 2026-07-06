import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import { BonusPointError, deleteBonusPoint } from '@/lib/bonus-points';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteBonusPoint(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof BonusPointError) {
      const status = err.code === 'NOT_FOUND' ? 404 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }
}
