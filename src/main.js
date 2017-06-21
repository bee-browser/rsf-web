// This file is distributed under the MIT license.
// See LICENSE file in the project root for details.

// Enable pusher logging - don't include this in production
//Pusher.logToConsole = true;

const pusher = new Pusher('12f8df9a36b24c35570c', {
  cluster: 'ap1',
  encrypted: true
});

// models

let surface = {
  name: null,
  channel: null,
  width: 1000,
  height: 200
};

// components

const ConnectView = {
  data() { return surface; },
  template: '#connect-view-template',
  methods: {
    connect() {
      const channel = pusher.subscribe(surface.name);
      channel.bind('pusher:subscription_succeeded', () => {
        surface.channel = channel;
      });
      channel.bind('pusher:subscription_error', (status) => {
        console.error("pusher:subscription_error: %d", status);
      });
    },
  }
};

const SurfaceView = {
  data() { return surface; },
  template: '#surface-view-template',
  created() {
    this.channel.bind('paint', this.receivePaintMessage);
  },
  methods: {
    disconnect() {
      pusher.unsubscribe(this.name);
      this.channel = null;
    },
    receivePaintMessage: _.partial(function(ctx, data) {
      ctx.pendingMessages[data.seqNo] = data.message;
      while (ctx.seqNo in ctx.pendingMessages) {
        const msg = ctx.pendingMessages[ctx.seqNo];
        delete ctx.pendingMessages[ctx.seqNo];
        this.paint(msg);
        if (msg.type === 'end_paint') {
          ctx.seqNo = 0;
        } else {
          ctx.seqNo++;
        }
      }
    }, {
      // Pusher seems not to keep the order of messages.  For keeping it, the
      // sequence number in data from Pusher is checked before processing the
      // message.
      seqNo: 0, pendingMessages: {}
    }),
    paint(msg) {
      switch (msg.type) {
      case 'start_paint':
        this.setSize(msg.width, msg.height);
        break;
      case 'fill_rect':
        this.fillRect(msg.rect, msg.color);
        break;
      case 'end_paint':
        this.flush();
        break;
      }
    },
    setSize(width, height) {
      this.width = width;
      this.height = height;
    },
    fillRect(rect, color) {
      const ctx = $('canvas').get(0).getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    },
    flush() {
    }
  }
};

// app

const app = new Vue({
  el: '#app',
  data() { return surface; },
  components: {
    'connect-view': ConnectView,
    'surface-view': SurfaceView
  }
});
