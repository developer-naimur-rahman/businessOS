import { NextResponse } from 'next/server';

let logisticsConfig = {
  steadfastApiKey: 'demo_sf_key_sandbox_001',
  steadfastSecretKey: 'demo_sf_secret_sandbox_001',
  pathaoClientId: 'demo_pathao_client_id_001',
  pathaoClientSecret: 'demo_pathao_secret_001',
  pathaoStoreId: '10294',
  defaultDeliveryType: 'STEADFAST_AIR',
  autoPrintShippingLabel: true
};

export async function GET() {
  return NextResponse.json(logisticsConfig);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    logisticsConfig = { ...logisticsConfig, ...body };
    return NextResponse.json({ success: true, message: 'Courier configurations saved', config: logisticsConfig });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Failed' }, { status: 400 });
  }
}
