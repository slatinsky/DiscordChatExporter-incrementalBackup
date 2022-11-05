export async function paranoidSleep() {
    // PARANOID MODE - random delay to avoid hitting rate limit and bot detection
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5745));
}