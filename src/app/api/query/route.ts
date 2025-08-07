import { NextRequest, NextResponse } from 'next/server';
import { queryRagChain } from '@/lib/retrieval/retriever';
import { connectToDatabase } from '@/lib/utils/mongodb';
import { ChatSession } from '@/lib/models/chatSession';
import { processSuperAgentQuery } from '@/lib/agent/superAgent';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { question, sessionId } = await request.json();
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Question is required and must be a non-empty string'
      }, { status: 400 });
    }
    
    // Process query using the super agent
    const answer = await processSuperAgentQuery(question, sessionId);
    
    // If sessionId is provided, save the conversation to the chat session
    if (sessionId) {
      try {
        await connectToDatabase();
        
        const session = await ChatSession.findById(sessionId);
        
        if (session) {
          // Add user message
          session.messages.push({
            role: 'user',
            content: question,
            timestamp: new Date()
          });
          
          // Add assistant message
          session.messages.push({
            role: 'assistant',
            content: answer,
            timestamp: new Date()
          });
          
          // Update session title if it's the first message
          if (session.messages.length === 2 && session.title === 'New Chat') {
            // Use the first few words of the question as the title
            const titlePreview = question.split(' ').slice(0, 5).join(' ');
            session.title = titlePreview + (question.length > titlePreview.length ? '...' : '');
          }
          
          await session.save();
        }
      } catch (dbError) {
        console.error('Error saving conversation to session:', dbError);
        // Continue even if saving to DB fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      question,
      answer,
      sessionId
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
