import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/mongodb';
import { ChatSession } from '@/lib/models/chatSession';

// GET all chat sessions
export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all chat sessions, sorted by updatedAt (newest first)
    const sessions = await ChatSession.find({})
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt');
    
    return NextResponse.json({ success: true, data: sessions });
  } catch (error: any) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST create a new chat session
export async function POST(request: NextRequest) {
  try {
    const { title = 'New Chat' } = await request.json();
    
    await connectToDatabase();
    
    // Create a new chat session
    const newSession = await ChatSession.create({
      title,
      messages: []
    });
    
    return NextResponse.json({ 
      success: true, 
      data: newSession 
    });
  } catch (error: any) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create chat session' },
      { status: 500 }
    );
  }
}
