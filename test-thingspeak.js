import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testThingSpeak() {
  try {
    console.log('🔍 Testing ThingSpeak Connection...\n');
    
    const channelId = process.env.THINGSPEAK_CHANNEL_ID;
    const readKey = process.env.THINGSPEAK_READ_KEY;
    
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readKey}&results=1`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data.feeds && response.data.feeds.length > 0) {
      console.log('✅ ThingSpeak Connected Successfully!');
      console.log(`Channel: ${channelId}`);
      console.log(`Latest Feed: ${JSON.stringify(response.data.feeds[0], null, 2)}`);
    } else {
      console.log('⚠️  ThingSpeak Responded but no data');
    }
    
    console.log('\n✓ ThingSpeak Connection Valid!');
  } catch (error) {
    console.log('❌ ThingSpeak Connection Failed:');
    console.log(`Error: ${error.message}`);
  }
}

testThingSpeak();
