const BLOCKED_HOSTNAMES = ['nope.mywebsite.com', 'bye.website.com']
async function handleRequest(request: Request): Promise<Response> {
  // Return a new Response based on..
  // On URL's hostname
  let url = new URL(request.url)
  if (BLOCKED_HOSTNAMES.includes(url.hostname)) {
    return new Response('Blocked Host', { status: 403 })
  }
  // On URL's file extenstion (e.g. block paths ending in .doc or .xml)
  let forbiddenExtRegExp = new RegExp(/\.(doc|xml)$/)
  if (forbiddenExtRegExp.test(url.pathname)) {
    return new Response('Blocked Extension', { status: 403 })
  }
  // On HTTP method
  if (request.method === 'POST') {
    return new Response('Response for POST')
  }
  // On User Agent
  let userAgent = request.headers.get('User-Agent') || ''
  if (userAgent.includes('bot')) {
    return new Response('Block User Agent containing bot', { status: 403 })
  }
  // On Client's IP address
  let clientIP = request.headers.get('CF-Connecting-IP')
  if (clientIP === '1.2.3.4') {
    return new Response('Block the IP 1.2.3.4', { status: 403 })
  }
  // On ASN
  if (request.cf.asn == 64512) {
    return new Response('Block the ASN 64512 response')
  }
  // On Device Type
  //  Requires Enterprise "CF-Device-Type Header" zone setting or
  //  Page Rule with "Cache By Device Type" setting applied.
  let device = request.headers.get('CF-Device-Type')
  if (device === 'mobile') {
    return Response.redirect('https://mobile.example.com')
  }
  console.error(
    "Getting Client's IP address, device type, and ASN are not supported in playground. Must test on a live worker",
  )
  return fetch(request)
}
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

export {}
