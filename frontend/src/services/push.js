export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    console.error('SW registration failed', e);
    return null;
  }
}

export async function subscribePush() {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }
    
    // Check if push manager is supported
    if (!('PushManager' in window)) {
      throw new Error('Push messaging is not supported in this browser');
    }

    // Register service worker
    const reg = await registerServiceWorker();
    if (!reg) {
      throw new Error('Failed to register service worker');
    }

    // Get public key from server
    const r = await fetch('http://localhost:5001/api/push/public-key');
    if (!r.ok) {
      throw new Error(`Failed to get public key: ${r.status} ${r.statusText}`);
    }
    const { publicKey } = await r.json();
    
    if (!publicKey) {
      throw new Error('No public key received from server');
    }

    // Convert key and subscribe
    const key = urlBase64ToUint8Array(publicKey);
    const sub = await reg.pushManager.subscribe({ 
      userVisibleOnly: true, 
      applicationServerKey: key 
    });

    // Send subscription to server
    const subscribeResponse = await fetch('http://localhost:5001/api/push/subscribe', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(sub) 
    });

    if (!subscribeResponse.ok) {
      throw new Error(`Failed to subscribe: ${subscribeResponse.status} ${subscribeResponse.statusText}`);
    }

    localStorage.setItem('ldt:pushSubscribed', 'true');
    return sub;
  } catch (e) { 
    console.error('Push subscription error:', e); 
    throw e; 
  }
}

export async function unsubscribePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await fetch('http://localhost:5001/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
      await sub.unsubscribe();
    }
    localStorage.removeItem('ldt:pushSubscribed');
  } catch (e) { console.error(e); }
}

export async function sendTestPush() {
  try {
    const response = await fetch('http://localhost:5001/api/push/test', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Test push failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (e) {
    console.error('Test push error:', e);
    throw e;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}


