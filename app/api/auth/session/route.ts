import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken, userId, email, displayName } = await request.json();
    
    if (!idToken || !userId) {
      return NextResponse.json({ error: 'ID token and user ID required' }, { status: 400 });
    }
    
    // Create basic session data with the provided information
    // The client-side auth will handle Firestore operations with proper auth context
    const sessionData = {
      userId: userId,
      email: email || `user-${userId}@temp.com`,
      name: displayName || email?.split('@')[0] || "User",
      // Default values - these will be updated by client-side operations
      role: "coworker",
      isAdmin: false
    };
    
    // Store the session data as a JSON string
    const sessionCookie = JSON.stringify(sessionData);
    
    // Set session cookie
    cookies().set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    console.log('Session created successfully for user:', userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
