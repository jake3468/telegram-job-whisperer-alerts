
import { useAuth } from '@clerk/clerk-react';
import { testJWTTransmission, getCurrentJWTToken, makeAuthenticatedRequest } from '@/integrations/supabase/client';
import { supabase } from '@/integrations/supabase/client';

export const useJWTDebug = () => {
  const { getToken, isSignedIn, userId } = useAuth();

  const runComprehensiveJWTTest = async () => {
    console.log('\n🔍 === COMPREHENSIVE JWT DEBUG TEST WITH DIRECT AUTH ===');
    console.log('📋 Test Parameters:');
    console.log('  - Signed In:', isSignedIn);
    console.log('  - User ID:', userId);
    console.log('  - Has getToken:', !!getToken);

    if (!isSignedIn || !getToken) {
      console.log('❌ Cannot run test - user not signed in or getToken unavailable');
      return { success: false, error: 'Not signed in' };
    }

    try {
      // Test 1: Get fresh Clerk JWT
      console.log('\n📝 Test 1: Fresh Clerk JWT Token');
      const freshToken = await getToken({ template: 'supabase', skipCache: true });
      console.log('  - Token obtained:', freshToken ? '✅ YES' : '❌ NO');
      
      if (freshToken) {
        console.log('  - Token length:', freshToken.length);
        console.log('  - Token parts:', freshToken.split('.').length);
        console.log('  - Token preview:', freshToken.substring(0, 100) + '...');
        
        // Decode and inspect payload
        try {
          const payload = JSON.parse(atob(freshToken.split('.')[1]));
          console.log('  - Token payload keys:', Object.keys(payload));
          console.log('  - Issuer (iss):', payload.iss);
          console.log('  - Subject (sub):', payload.sub);
          console.log('  - Audience (aud):', payload.aud || 'NOT_SET');
          console.log('  - Role:', payload.role || 'NOT_SET');
          console.log('  - Expires (exp):', new Date(payload.exp * 1000).toISOString());
          console.log('  - Issued at (iat):', new Date(payload.iat * 1000).toISOString());
          
          // Validate required claims for Supabase
          const hasRequiredClaims = payload.aud === 'authenticated' && payload.role === 'authenticated';
          console.log('  - Has required Supabase claims:', hasRequiredClaims ? '✅ YES' : '❌ NO');
          
          if (!hasRequiredClaims) {
            console.error('  - 🚨 MISSING REQUIRED CLAIMS! Please update Clerk JWT template:');
            console.error('  -   Add: "aud": "authenticated"');
            console.error('  -   Add: "role": "authenticated"');
          }
        } catch (e) {
          console.log('  - ❌ Could not decode token payload:', e);
        }
      }

      // Test 2: Check current stored token
      console.log('\n🗄️ Test 2: Current Stored Token');
      const currentToken = getCurrentJWTToken();
      console.log('  - Token stored:', currentToken ? '✅ YES' : '❌ NO');
      console.log('  - Tokens match:', (freshToken === currentToken) ? '✅ YES' : '❌ NO');

      // Test 3: Test JWT transmission to Supabase with direct auth headers
      console.log('\n🔗 Test 3: JWT Transmission with Direct Auth Headers');
      const transmissionTest = await testJWTTransmission();
      console.log('  - Transmission successful:', transmissionTest.data ? '✅ YES' : '❌ NO');
      console.log('  - Transmission error:', transmissionTest.error?.message || 'None');
      
      if (transmissionTest.data && transmissionTest.data.length > 0) {
        const result = transmissionTest.data[0];
        console.log('  - JWT recognized by Supabase:', result.clerk_id ? '✅ YES' : '❌ NO');
        console.log('  - Auth role from Supabase:', result.auth_role || 'NOT_SET');
        console.log('  - User exists in DB:', result.user_exists ? '✅ YES' : '❌ NO');
        console.log('  - Raw JWT claims setting:', result.current_setting_claims || 'NOT_AVAILABLE');
        
        // Provide specific diagnosis
        if (!result.clerk_id) {
          console.error('\n🚨 DIAGNOSIS: JWT WITH DIRECT HEADERS NOT REACHING SUPABASE BACKEND');
          console.error('  - Possible causes:');
          console.error('  1. Direct header injection not working properly');
          console.error('  2. Supabase client proxy not intercepting requests');
          console.error('  3. RLS function not extracting claims from Authorization header');
          console.error('  4. JWT format or encoding issue');
        } else {
          console.log('\n✅ SUCCESS: JWT with direct headers properly recognized by Supabase!');
        }
      }

      // Test 4: Test direct authenticated request to user_profile
      console.log('\n👤 Test 4: Direct Profile Access with Auth Headers');
      try {
        const { data: profileData, error: profileError } = await makeAuthenticatedRequest(() =>
          supabase
            .from('user_profile')
            .select('id, user_id, bio, created_at')
            .limit(1)
        );

        console.log('  - Profile query successful:', !profileError ? '✅ YES' : '❌ NO');
        if (profileError) {
          console.log('  - Profile error:', profileError.message);
          console.log('  - Profile error code:', profileError.code);
        } else {
          console.log('  - Profile data accessible:', profileData ? '✅ YES' : '❌ NO');
          console.log('  - Profile records found:', profileData?.length || 0);
        }
      } catch (error) {
        console.error('  - Profile access test failed:', error);
      }

      console.log('\n✅ === JWT DEBUG TEST WITH DIRECT AUTH COMPLETE ===\n');

      return {
        success: true,
        hasToken: !!freshToken,
        tokenStored: !!currentToken,
        tokensMatch: freshToken === currentToken,
        transmissionWorking: !!transmissionTest.data,
        jwtRecognized: transmissionTest.data?.[0]?.clerk_id ? true : false,
        hasRequiredClaims: freshToken ? (() => {
          try {
            const payload = JSON.parse(atob(freshToken.split('.')[1]));
            return payload.aud === 'authenticated' && payload.role === 'authenticated';
          } catch {
            return false;
          }
        })() : false
      };

    } catch (error) {
      console.error('❌ JWT Debug Test with Direct Auth Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return { runComprehensiveJWTTest };
};
