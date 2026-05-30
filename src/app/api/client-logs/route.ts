import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/zoho';
import { cookies } from 'next/headers';

const API_URL = process.env.ZOHO_API_URL || 'https://sheet.zoho.in/api/v2';

function getSheetId(team: string) {
  return team === 'BA DELTA'
    ? process.env.ZOHO_CLIENT_LOG_DELTA_SHEET_ID
    : process.env.ZOHO_CLIENT_LOG_ALPHA_SHEET_ID;
}

// GET /api/client-logs?client=GEPL  → fetch records from that worksheet
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const team = cookieStore.get('zoho_updater_team')?.value;
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('client');
    if (!clientName) return NextResponse.json({ error: 'client param required' }, { status: 400 });

    const sheetId = getSheetId(team);
    if (!sheetId) return NextResponse.json({ error: 'Client log sheet ID not configured' }, { status: 500 });

    const accessToken = await getValidAccessToken();

    const url = new URL(`${API_URL}/${sheetId}`);
    url.searchParams.append('method', 'worksheet.records.fetch');
    url.searchParams.append('worksheet_name', clientName);

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
    });
    const data = await res.json();

    if (data.status === 'failure') {
      return NextResponse.json({ error: data.error_message, code: data.error_code }, { status: 502 });
    }

    return NextResponse.json(data.records || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/client-logs  → add a new log row to the worksheet
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const team = cookieStore.get('zoho_updater_team')?.value;
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { client, status, updateInfo, remarks, projectLink, updatedDate } = body;

    if (!client) return NextResponse.json({ error: 'client is required' }, { status: 400 });

    const sheetId = getSheetId(team);
    if (!sheetId) return NextResponse.json({ error: 'Client log sheet ID not configured' }, { status: 500 });

    const accessToken = await getValidAccessToken();

    const url = new URL(`${API_URL}/${sheetId}`);
    const params = new URLSearchParams();
    params.append('method', 'worksheet.records.add');
    params.append('worksheet_name', client);
    params.append('header_row', '1');

    const rowData = {
      'Status': status,
      'UPDATE INFORMATION': updateInfo,
      'REMARKS': remarks,
      'Project Web/Mob Link': projectLink,
      'Updated date': updatedDate,
    };

    params.append('json_data', JSON.stringify([rowData]));

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await res.json();
    if (data.status === 'failure') {
      return NextResponse.json({ error: data.error_message }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
