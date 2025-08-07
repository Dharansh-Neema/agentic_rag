import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/utils/mongodb';
import { ChatSession } from '@/lib/models/chatSession';

// GET a specific chat session by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await connectToDatabase();
    
    const session = await ChatSession.findById(id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Chat session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error(`Error fetching chat session ${params.id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}

// PUT update a chat session (title or add messages)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { title, message } = await request.json();
    
    await connectToDatabase();
    
    const session = await ChatSession.findById(id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Chat session not found' },
        { status: 404 }
      );
    }
    
    // Update title if provided
    if (title) {
      session.title = title;
    }
    
    // Add message if provided
    if (message) {
      session.messages.push(message);
    }
    
    await session.save();
    
    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    console.error(`Error updating chat session ${params.id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

// DELETE a chat session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    await connectToDatabase();
    
    const result = await ChatSession.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Chat session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Chat session deleted successfully' 
    });
  } catch (error: any) {
    console.error(`Error deleting chat session ${params.id}:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
