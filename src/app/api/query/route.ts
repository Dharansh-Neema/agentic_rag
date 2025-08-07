import { NextRequest, NextResponse } from 'next/server';
import { queryRagChain } from '@/lib/retrieval/retriever';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Question is required and must be a non-empty string'
      }, { status: 400 });
    }
    
    const answer = await queryRagChain(question);
    
    return NextResponse.json({ 
      success: true, 
      question,
      answer
    }, { status: 200 });
  } catch (error) {
    console.error('Error querying RAG system:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process query',
      error: (error as Error).message
    }, { status: 500 });
  }
}
