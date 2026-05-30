import { NextResponse } from 'next/server';
import { getValidAccessToken, ZOHO_CONFIG } from '@/lib/zoho';
import { cookies } from 'next/headers';

// Environment variable for the Zoho Sheet Document ID
const SHEET_ID = process.env.ZOHO_SHEET_ID;

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const team = cookieStore.get('zoho_updater_team')?.value;
    
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!SHEET_ID) return NextResponse.json({ error: 'Sheet ID not configured' }, { status: 500 });

    const accessToken = await getValidAccessToken();
    
    // Determine worksheet name based on team
    const worksheetName = team === 'BA DELTA' ? 'DELTA' : 'ALFHA';

    const { searchParams } = new URL(request.url);
    const clientName = searchParams.get('client');

    // Zoho Sheet API to fetch records
    // Assuming the sheet has a header row.
    const url = new URL(`${ZOHO_CONFIG.apiUrl}/${SHEET_ID}`);
    url.searchParams.append('method', 'worksheet.records.fetch');
    url.searchParams.append('worksheet_name', worksheetName);
    if (clientName) {
      // Zoho criteria format requires parentheses wrapping
      url.searchParams.append('criteria', `("Client"="${clientName}")`);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`
      }
    });

    const data = await response.json();
    
    if (data.status === 'failure') {
      console.error('Zoho fetch error:', data.error_message, '| code:', data.error_code);
      return NextResponse.json({ error: data.error_message }, { status: 502 });
    }

    return NextResponse.json(data.records || []);
  } catch (error: any) {
    console.error("Error fetching issues from Zoho:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const team = cookieStore.get('zoho_updater_team')?.value;
    
    if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!SHEET_ID) return NextResponse.json({ error: 'Sheet ID not configured' }, { status: 500 });

    const newIssue = await request.json();
    const accessToken = await getValidAccessToken();
    const worksheetName = team === 'BA DELTA' ? 'DELTA' : 'ALFHA';

    // Format the payload for Zoho Sheets API worksheet.records.add
    const url = new URL(`${ZOHO_CONFIG.apiUrl}/${SHEET_ID}`);
    
    const params = new URLSearchParams();
    params.append('method', 'worksheet.records.add');
    params.append('worksheet_name', worksheetName);
    
    // Map our JSON keys to the actual Sheet Column headers
    const rowData = {
      "Client": newIssue.client,
      "Issue Subject Line": newIssue.subjectLine,
      "Status": newIssue.status,
      "Live/UAT": newIssue.liveUat,
      "Issue/Requirement": newIssue.issueReq,
      "Project and Version": newIssue.projectVersion,
      "Child Id Details": newIssue.childIds,
      "Handled By": newIssue.handledBy,
      "Remarks": newIssue.remarks,
      "Raised Date": newIssue.raisedDate,
      "Additional Info": newIssue.additionalInfo
    };
    
    params.append('header_row', '1');
    params.append('json_data', JSON.stringify([rowData]));

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error saving issue to Zoho:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
