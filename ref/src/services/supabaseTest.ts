/**
 * Supabase Connection Test Utility
 * 
 * Use this in browser console to test Supabase connection:
 * import { testSupabaseConnection } from './services/supabaseTest'
 * testSupabaseConnection()
 */

import { supabase } from './supabaseClient';

export async function testSupabaseConnection() {
  console.log('\n=== Testing Supabase Connection ===\n');
  
  // Test 1: Check client configuration
  console.log('1. Client Configuration:');
  console.log('   Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('   Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('\n❌ Environment variables not configured!');
    console.error('Please create .env.local file with:');
    console.error('VITE_SUPABASE_URL=your_supabase_url');
    console.error('VITE_SUPABASE_ANON_KEY=your_anon_key');
    return;
  }
  
  // Test 2: Try to fetch projects
  console.log('\n2. Testing Database Connection:');
  try {
    const { data, error, status } = await supabase
      .from('projects')
      .select('id, name, description')
      .limit(5);
    
    console.log('   Response status:', status);
    
    if (error) {
      console.error('   ❌ Database Error:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      
      if (error.code === '42P01') {
        console.error('\n   Table "projects" does not exist!');
        console.error('   Please create the table in Supabase Dashboard.');
      } else if (error.message.includes('Invalid API key')) {
        console.error('\n   Invalid API key!');
        console.error('   Please check your VITE_SUPABASE_ANON_KEY.');
      }
    } else {
      console.log('   ✅ Connection successful!');
      console.log('   Projects found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('   Sample projects:');
        data.forEach(p => {
          console.log(`     - ${p.name} (ID: ${p.id})`);
        });
      } else {
        console.log('   ⚠️  No projects in database yet.');
        console.log('   Add projects using Supabase Dashboard.');
      }
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err);
  }
  
  // Test 3: Check table structure
  console.log('\n3. Checking Table Structure:');
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('   ❌ Cannot check structure:', error.message);
    } else if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log('   ✅ Table columns found:', columns.join(', '));
      
      // Check required columns
      const required = ['id', 'name', 'description', 'models_context', 'models_project', 'models_heatmap', 'records'];
      const missing = required.filter(col => !columns.includes(col));
      
      if (missing.length > 0) {
        console.warn('   ⚠️  Missing columns:', missing.join(', '));
      } else {
        console.log('   ✅ All required columns present');
      }
    } else {
      console.log('   ℹ️  Table is empty, cannot check structure');
    }
  } catch (err) {
    console.error('   ❌ Error checking structure:', err);
  }
  
  console.log('\n=== Test Complete ===\n');
}

// Auto-run test in development mode if window.testSupabase is set
if (import.meta.env.DEV && (window as any).testSupabase) {
  testSupabaseConnection();
}
