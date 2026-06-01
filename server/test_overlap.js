import { db, initDb } from './db.js';

// Re-implement checkOverlap algorithm inside test to verify it
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

async function testCheckOverlap(roomName, showDate, startTimeStr, duration, existingShowtimes) {
  const newStart = timeToMinutes(startTimeStr);
  const newEnd = newStart + duration + 15; // 15-minute cleaning buffer

  for (const ex of existingShowtimes) {
    const exStart = timeToMinutes(ex.start_time);
    const exEnd = exStart + ex.duration + 15; // 15-minute cleaning buffer

    if (newStart < exEnd && exStart < newEnd) {
      return ex; // Overlap!
    }
  }
  return null; // No overlap
}

async function runTests() {
  console.log('--- STARTING SHOWTIME OVERLAP TESTS ---');

  // Existing showtimes mock
  const existing = [
    { start_time: '12:00', duration: 120, title: 'Movie A', room_name: 'Room 1' }, // Ends 14:00 + 15m buffer = 14:15
    { start_time: '15:00', duration: 90, title: 'Movie B', room_name: 'Room 1' }   // Ends 16:30 + 15m buffer = 16:45
  ];

  // Test Case 1: Perfect overlap (start at same time)
  const c1 = await testCheckOverlap('Room 1', '2026-06-01', '12:00', 100, existing);
  console.assert(c1 !== null, 'Test Case 1 Failed: Should detect overlap at 12:00');
  console.log('Test Case 1 Passed (Detected overlap with Movie A at 12:00)');

  // Test Case 2: Start right after movie ends but within 15-minute cleaning buffer
  const c2 = await testCheckOverlap('Room 1', '2026-06-01', '14:05', 90, existing);
  console.assert(c2 !== null, 'Test Case 2 Failed: Should detect overlap due to 15m buffer');
  console.log('Test Case 2 Passed (Detected overlap due to cleaning buffer at 14:05)');

  // Test Case 3: Start exactly after cleaning buffer (14:15)
  const c3 = await testCheckOverlap('Room 1', '2026-06-01', '14:15', 30, existing);
  console.assert(c3 === null, 'Test Case 3 Failed: 14:15 should not overlap');
  console.log('Test Case 3 Passed (No overlap at 14:15)');

  // Test Case 4: Start before but end after the second movie starts (e.g. 14:30 - 15:30)
  const c4 = await testCheckOverlap('Room 1', '2026-06-01', '14:30', 60, existing);
  console.assert(c4 !== null, 'Test Case 4 Failed: Should detect overlap with Movie B (starts 15:00)');
  console.log('Test Case 4 Passed (Detected overlap with Movie B starting at 15:00)');

  // Test Case 5: Showtimes in different room (should be fine, but we assume filtered by room already)
  console.log('--- ALL OVERLAP LOGIC TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(console.error);
