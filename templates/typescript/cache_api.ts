async function handleRequest(event: FetchEvent): Promise<Response> {
  let request = event.request
  let cacheUrl = new URL(request.url)
  // hostname for a different zone
  cacheUrl.hostname = someOtherHostname
  let cacheKey = new Request(cacheUrl.toString(), request)
  let cache = caches.default
  // Get this request from this zone's cache
  let response = await cache.match(cacheKey)
  if (!response) {
    //if not in cache, grab it from the origin
    response = await fetch(request)
    // must use Response constructor to inherit all of response's fields
    response = new Response(response.body, response)
    // Cache API respects Cache-Control headers, so by setting max-age to 10
    // the response will only live in cache for max of 10 seconds
    response.headers.append('Cache-Control', 'max-age=10')
    // store the fetched response as cacheKey
    // use waitUntil so computational expensive tasks don't delay the response
    event.waitUntil(cache.put(cacheKey, response.clone()))
  }
  return response
}
async function handlePostRequest(event: FetchEvent): Promise<Response> {
  let request = event.request
  let body = await request.clone().text()
  let hash = await sha256(body)
  let cacheUrl = new URL(request.url)
  // get/store the URL in cache by prepending the body's hash
  cacheUrl.pathname = '/posts' + cacheUrl.pathname + hash
  // Convert to a GET to be able to cache
  let cacheKey = new Request(cacheUrl.toString(), {
    headers: request.headers,
    method: 'GET',
  })
  let cache = caches.default
  //try to find the cache key in the cache
  let response = await cache.match(cacheKey)
  // otherwise, fetch response to POST request from origin
  if (!response) {
    response = await fetch(request)
    event.waitUntil(cache.put(cacheKey, response))
  }
  return response
}
addEventListener('fetch', event => {
  try {
    let request = event.request
    if (request.method.toUpperCase() === 'POST')
      return event.respondWith(handlePostRequest(event))
    return event.respondWith(handleRequest(event))
  } catch (e) {
    return event.respondWith(new Response('Error thrown ' + e.message))
  }
})
async function sha256(message: string): Promise<string> {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message)
  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // convert bytes to hex string
  const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('')
  return hashHex
}
const someOtherHostname = 'my.herokuapp.com'

export {}
