import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'projects.txt');
    
    if (!fs.existsSync(filePath)) {
       return NextResponse.json([], { status: 200 });
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const lines = fileContents.split('\n').filter(line => line.trim() !== '');
    
    const projects = lines.map(line => {
      const [idPart, namePart] = line.split('|');
      const id = idPart.replace('project_id=', '').trim();
      const name = namePart ? namePart.trim() : '';
      return { id, name };
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read projects file' }, { status: 500 });
  }
}
