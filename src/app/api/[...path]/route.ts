import type { NextRequest } from 'next/server';
import { proxyToKong } from '@/lib/proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return proxyToKong(req);
}

export async function POST(req: NextRequest) {
  return proxyToKong(req);
}

export async function PUT(req: NextRequest) {
  return proxyToKong(req);
}

export async function PATCH(req: NextRequest) {
  return proxyToKong(req);
}

export async function DELETE(req: NextRequest) {
  return proxyToKong(req);
}

export async function HEAD(req: NextRequest) {
  return proxyToKong(req);
}

export async function OPTIONS(req: NextRequest) {
  return proxyToKong(req);
}
