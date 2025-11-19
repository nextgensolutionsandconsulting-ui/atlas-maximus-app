// Test D-ID credentials
const DID_API_KEY = process.env.DID_API_KEY || 'YWlrZW5kcnVtMTlAZ21haWwuY29t:SurLgY8zqzDV6J8VDur3f'
const DID_AGENT_CLIENT_KEY = process.env.DID_AGENT_CLIENT_KEY || 'WjI5dloyeGxMVzloZFhSb01ud3hNRFk0TlRnMU16WTFOak0zTXpFMk5ESXdOVE02ZGt4NE9FRUNUM2ROVlRGTlp6Uk1TMmxHVEVwTw=='
const DID_AGENT_ID = process.env.DID_AGENT_ID || 'v2_agt_lBzR69kc'

console.log('Testing D-ID credentials...\n')
console.log('API Key:', DID_API_KEY.substring(0, 30) + '...')
console.log('Client Key:', DID_AGENT_CLIENT_KEY.substring(0, 30) + '...')
console.log('Agent ID:', DID_AGENT_ID)
console.log('\nTesting D-ID API connectivity...')

// Test basic D-ID API connectivity
fetch('https://api.d-id.com/agents', {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${DID_API_KEY}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('\nD-ID API Response Status:', response.status, response.statusText)
  return response.json()
})
.then(data => {
  console.log('D-ID API Response:', JSON.stringify(data, null, 2))
})
.catch(error => {
  console.error('D-ID API Error:', error.message)
})
