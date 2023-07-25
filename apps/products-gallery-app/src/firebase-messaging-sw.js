/* eslint-disable no-undef */

// eslint-disable-next-line no-undef
importScripts('./ngsw-worker.js');



// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
// importScripts('/__/firebase/7.17.2/firebase-app.js');
// importScripts('/__/firebase/7.17.2/firebase-messaging.js');
// importScripts('/__/firebase/init.js');

// const messaging = firebase.messaging();
// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/7.19.0/firebase-app.js');
// eslint-disable-next-line no-undef
importScripts('https://www.gstatic.com/firebasejs/7.19.0/firebase-messaging.js');
/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.

 // [START initialize_firebase_in_sw]
 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.

**/
// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  projectId: 'store-gallary',
  appId: '1:349758193130:web:a59c7768c7b7708c9e4693',
  storageBucket: 'store-gallary.appspot.com',
  locationId: 'us-central',
  apiKey: 'AIzaSyCFRT75Yfhhvk0S4lHL8g_pIXyKznOqDjI',
  authDomain: 'store-gallary.firebaseapp.com',
  messagingSenderId: '349758193130',
  measurementId: 'G-6X66MGWVNV',
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
// [END initialize_firebase_in_sw]

/*
 * We need a generic class to hold data and methods, that inherit from Event
 */
// class CustomPushEvent extends Event {
//   constructor(data) {
//     super('push')

//     Object.assign(this, data)
//     this.custom = true
//   }
// }

/*
 * Overrides push notification data, to avoid having 'notification' key and firebase blocking
 * the message handler from being called
//  */
// self.addEventListener('push', (e) => {
//   // Skip if event is our own custom event
//   if (e.custom) return;

//   // Kep old event data to override
//   let oldData = e.data

// Create a new event to dispatch
//   let newEvent = new CustomPushEvent({
//     data: {
//       json() {
//         let newData = oldData.json()
//         newData._notification = newData.notification
//         delete newData.notification
//         return newData
//       },
//     },

//     waitUntil: e.waitUntil.bind(e),
//   })

//   // Stop event propagation
//   e.stopImmediatePropagation()

//   // Dispatch the new wrapped event
//   dispatchEvent(newEvent)
// })
// async function updatePrevNotifications(){

// };

messaging.onBackgroundMessage(async function (payload) {
  console.log("onBackgroundMessage");
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  let { title, ...options } = payload.data;
  options.icon = './assets/favicon.png';
  // title = "from servicew" + title;
  const notificationFilter = { tag: options.tag};
  const accountName = options.accountName;
  let accountUpdateCount = {};
  accountUpdateCount[accountName] = 1;

  await self.registration.getNotifications(notificationFilter) 
    .then(function (notifications) {
      if (notifications && notifications.length > 0) {
        // Start with one to account for the new notification
        // we are adding
        // var notificationCount = 1;
        for (var i = 0; i < notifications.length; i++) {
          var existingNotification = notifications[i];
          if (existingNotification.data &&  existingNotification.data.accountUpdateCount) {
              accountUpdateCount =  existingNotification.data.accountUpdateCount;
              if (accountUpdateCount[accountName]) {
                accountUpdateCount[accountName] += 1;
              } else {
                accountUpdateCount[accountName] = 1;
              }
             
              // existingNotification.data.notificationCount;
          } else {
            accountUpdateCount[accountName] = 1;
          }
          existingNotification.close();
        }
 
 //         options.data = {accountUpdateCount};
        // options.data.notificationCount = notificationCount;
      }
//        else 
//       {
// //        options.data = {accountUpdateCount};
// //
//       }

  //    return showNotification(title, message, icon, notificationData);
    });

    const updatedAccounts = Object.keys(accountUpdateCount);
    const bodyString = updatedAccounts.reduce((prev, cur,index) => {
      const newBody = prev + "\n" + "تم تعديل حساب *" + cur + "* " + accountUpdateCount[cur] + "مرة";
      return newBody;
    }, "")
    options.body  = bodyString;
    let lurl;
    if(options.bookId!=null && options.bookId != undefined){
      lurl = self.location.origin + '/book/' + options.bookId+ '/accounts'
    } else{
      lurl = self.location.origin + '/accounts'

    }
    
    options.data = {accountUpdateCount, url:lurl};
    console.log("options: ", options);



  const notificationTitle = "from sw" + payload.data.title;
  const notificationOptions = {
    // body: options.body,
    // icon: './assets/favicon.png',
    ...options,

    renotify: 'true',
  };

  return self.registration.showNotification(title,
    options);
});
// Notification click event listener
self.addEventListener('notificationclick', e => {
  // Close the notification popout
  e.notification.close();
  // Get all the Window clients
  e.waitUntil(clients.matchAll({ includeUncontrolled: false, type: 'window' }).then(clientsArr => {
    // If a Window tab matching the targeted URL already exists, focus that;
    console.log("clientsArr: ", clientsArr);
    const hadWindowWithSameUrlToFocus = clientsArr.some(windowClient => windowClient.url === e.notification.data.url ? (windowClient.focus(), true) : false);
    // else if in the last opened window, navigate to the target URL, and focus it
    if (!hadWindowWithSameUrlToFocus) {
      const lastClient = clientsArr[clientsArr.length -1];
      if(lastClient){
        lastClient.focus().then(windowClient => windowClient ? windowClient.navigate(e.notification.data.url ) : null);
      }
      else{
            // Otherwise, open a new tab to the applicable URL and focus it.

        clients.openWindow(e.notification.data.url).then(windowClient => windowClient ? windowClient.focus() : null);
      }
    }

  }));
});

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
// messaging.setBackgroundMessageHandler(function(payload) {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);
//   // Customize notification here
//   data = payload.data;
//   const notificationTitle = 'Background Message Title';
//   const notificationOptions = {
//     body: 'Background Message body.',
//     icon: '/firebase-logo.png'
//   };

//   return self.registration.showNotification(notificationTitle,
//     notificationOptions);
// });
// [END background_handler]




// self.addEventListener('fetch', (event) => {
//     if (event.request.url.indexOf('ngsw-bypass') >= 0) {

//         console.log('custom fetch trigered!')
//         console.log('event.request.method: '+ event.request.method )
//         console.log('event.request.url '+ event.request.url )
//         console.log('event.request.url.indexOf(share/image): '+event.request.url.indexOf('share/image') )
//         if (event.request.method === 'POST' && event.request.url.indexOf('share/image') >= 0) {
//             console.log(`event.request.method === 'POST' && event.request.url.indexOf('share/image') >= 0`);

//             /* This is to fix the issue Jake found */
//             event.respondWith(Response.redirect('/share/image'));
//             event.waitUntil(async function () {
//                 await nextMessage('share-ready');
//                 const data = await event.request.formData();
//                 const client = await self.clients.get(event.resultingClientId || event.clientId);
//                 // Get the data from the named element 'file'
//                 const file = data.get('file');
//                 console.log('file', file);
//                 client.postMessage({ file, action: 'load-image' });
//             }());
//         }
//     }

// });


// const nextMessageResolveMap = new Map();

// /**
//  * Wait on a message with a particular event.data value.
//  *
//  * @param dataVal The event.data value.
//  */
// function nextMessage(dataVal) {
//   return new Promise((resolve) => {
//     if (!nextMessageResolveMap.has(dataVal)) {
//       nextMessageResolveMap.set(dataVal, []);
//     }
//     nextMessageResolveMap.get(dataVal).push(resolve);
//   });
// }

// self.addEventListener('message', (event) => {
//   console.log('sw receive message :', event)
//   const resolvers = nextMessageResolveMap.get(event.data);
//   if (!resolvers) { return; }
//   nextMessageResolveMap.delete(event.data);
//   for (const resolve of resolvers) { resolve(); }
// });




self.addEventListener('fetch', (event) => {
  if (event.request.url.indexOf('ngsw-bypass') >= 0) {

      console.log('custom fetch trigered!')
      console.log('event.request.method: '+ event.request.method )
      console.log('event.request.url '+ event.request.url )
      console.log('event.request.url.indexOf(share/image): '+event.request.url.indexOf('share/image') )
      if (event.request.method === 'POST' && event.request.url.indexOf('share/image') >= 0) {
          console.log(`event.request.method === 'POST' && event.request.url.indexOf('share/image') >= 0`);

          /* This is to fix the issue Jake found */
          event.respondWith(Response.redirect('/share/image'));
          event.waitUntil(async function () {
              await nextMessage('share-ready');
              const formData = await event.request.formData();
              console.log(" event.request.formData() ", formData)
              console.log(" event ", event)
              const client = await self.clients.get(event.resultingClientId || event.clientId);
              // Get the data from the named element 'file'
              const mediaFiles = formData.getAll('image');

              const file = formData.get('image');
              console.log('file', file);
              console.log('mediaFiles', mediaFiles);
          //    client.postMessage({ file, action: 'load-image' });
              client.postMessage({ mediaFiles, action: 'load-image' });
          }());
      }
  }

});



const nextMessageResolveMap = new Map();

/**
 * Wait on a message with a particular event.data value.
 *
 * @param dataVal The event.data value.
 */
function nextMessage(dataVal) {
  return new Promise((resolve) => {
    if (!nextMessageResolveMap.has(dataVal)) {
      nextMessageResolveMap.set(dataVal, []);
    }
    nextMessageResolveMap.get(dataVal).push(resolve);
  });
}

self.addEventListener('message', (event) => {
  console.log('sw receive message :', event)
  const resolvers = nextMessageResolveMap.get(event.data);
  if (!resolvers) { return; }
  nextMessageResolveMap.delete(event.data);
  for (const resolve of resolvers) { resolve(); }
});