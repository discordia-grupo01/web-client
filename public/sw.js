self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

function readPayload(event) {
  try {
    return event.data ? event.data.json() : {};
  } catch {
    return {};
  }
}

function targetPath(data) {
  if (!data) return "/home";
  if (data.server_id && data.channel_id) {
    return (
      "/home?server=" +
      encodeURIComponent(data.server_id) +
      "&channel=" +
      encodeURIComponent(data.channel_id)
    );
  }
  if (data.server_id)
    return "/home?server=" + encodeURIComponent(data.server_id);
  if (data.author_id) return "/home?dm=" + encodeURIComponent(data.author_id);
  return "/home";
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  const data = payload.data || {};

  event.waitUntil(
    self.registration.showNotification(payload.title || "Discordia", {
      body: payload.body || "",
      icon: "/push-icon.png",
      tag: data.channel_id || data.conversation_id || data.message_id,
      renotify: true,
      data,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const path = targetPath(event.notification.data);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => {
        const open = windows.find((client) => "focus" in client);
        if (open) {
          return open.focus().then((focused) => {
            if ("navigate" in focused) return focused.navigate(path);
            return focused;
          });
        }
        return self.clients.openWindow(path);
      }),
  );
});
