import { NextRequest, NextResponse } from 'next/server';
import { ingestDocuments } from '@/lib/ingestion/dataIngestion';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { forceReindex } = await request.json();
    
    const result = await ingestDocuments(forceReindex || false);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Documents ingested successfully',
      data: result
    }, { status: 200 });
  } catch (error) {
    console.error('Error ingesting documents:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to ingest documents',
      error: (error as Error).message
    }, { status: 500 });
  }
}
