import { NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/zoho';
import { cookies } from 'next/headers';

const SHEET_ID = process.env.ZOHO_MEETING_SHEET_ID;
const API_URL = process.env.ZOHO_API_URL || 'https://sheet.zoho.in/api/v2';

function getWorksheet(team: string) {
  return team === 'BA DELTA' ? 'DELTA' : 'ALFHA';
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const team = cookieStore.get('zoho_updater_team')?.value;

    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!SHEET_ID) return NextResponse.json({ error: 'Meeting Sheet ID not configured' }, { status: 500 });

    const accessToken = await getValidAccessToken();
    const worksheetName = getWorksheet(team);

    const { searchParams } = new URL(request.url);
    const clientFilter = searchParams.get('client');

    const url = new URL(`${API_URL}/${SHEET_ID}`);
    url.searchParams.append('method', 'worksheet.records.fetch');
    url.searchParams.append('worksheet_name', worksheetName);
    if (clientFilter) {
      url.searchParams.append('criteria', `("CLIENT"="${clientFilter}")`);
    }

    const res = await fetch(url.toString(), {
      headers: { 'Authorization': `Zoho-oauthtoken ${accessToken}` }
    });

    const data = await res.json();

    if (data.status === 'failure') {
      console.error('Zoho meeting fetch error:', data.error_message);
      return NextResponse.json({ error: data.error_message }, { status: 502 });
    }

    return NextResponse.json(data.records || []);
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const team = cookieStore.get('zoho_updater_team')?.value;

    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!SHEET_ID) return NextResponse.json({ error: 'Meeting Sheet ID not configured' }, { status: 500 });

    const body = await request.json();
    const accessToken = await getValidAccessToken();
    const worksheetName = getWorksheet(team);

    const url = new URL(`${API_URL}/${SHEET_ID}`);
    const params = new URLSearchParams();
    params.append('method', 'worksheet.records.add');
    params.append('worksheet_name', worksheetName);
    params.append('header_row', '1');

    const rowData = {
      'CLIENT': body.client,
      'MEETING AGENDA': body.agenda,
      'Date & Time': body.dateTime,
      'Participants': body.participants,
      'BA Participants': body.baParticipants,
      'MEETING LINK': body.meetingLink,
      'Remarks': body.remarks,
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
  } catch (error: any) {
    console.error('Error saving meeting:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
