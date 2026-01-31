async function testBulkNotification() {
    console.log("Testing Bulk Upload Completion Notification...");
    const response = await fetch('http://localhost:3015/notify/bulk-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'admin-123',
            count: 25,
            status: 'Success'
        })
    });

    const data = await response.json();
    console.log("Response:", data);
}

testBulkNotification();
