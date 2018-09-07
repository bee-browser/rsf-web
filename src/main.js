// This file is distributed under the MIT license.
// See LICENSE file in the project root for details.

// Enable pusher logging - don't include this in production
//Pusher.logToConsole = true;

const pusher = new Pusher('12f8df9a36b24c35570c', {
  cluster: 'ap1',
  forceTLS: true
});

// models

let channelName = '';
if (location.hash.length > 1) {
  channelName = location.hash.slice(1);
}

const surface = {
  name: channelName,
  channel: null,
  width: 1000,
  height: 200,
  paintBoxes: []
};

// Pusher seems not to keep the order of messages.  For keeping it, the
// sequence number in data from Pusher is checked before processing the
// message.
let seqNo = 0;
let pendingMessages = {};

// components

const ConnectView = {
  data() { return surface; },
  template: '#connect-view-template',
  methods: {
    connect() {
      const channel = pusher.subscribe(surface.name);
      channel.bind('pusher:subscription_succeeded', () => {
        this.channel = channel;
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
    receivePaintMessage(data) {
      pendingMessages[data.seqNo] = data.message;
      while (seqNo in pendingMessages) {
        const msg = pendingMessages[seqNo];
        delete pendingMessages[seqNo];
        this.paint(msg);
      }
    },
    paint(msg) {
      seqNo++;
      switch (msg.type) {
      case 'layout.painter.start':
        this.startPaint(msg.data);
        break;
      case 'layout.painter.fill_rect':
        this.fillRect(msg.data);
        break;
      case 'layout.painter.draw_border':
        this.drawBorder(msg.data);
        break;
      case 'layout.painter.draw_widget':
        this.drawWidget(msg.data);
        break;
      case 'layout.painter.draw_tiles':
        this.drawTiles(msg.data);
        break;
      case 'layout.painter.end':
        this.endPaint();
        break;
      }
    },
    startPaint({width, height}) {
      this.paintBoxes.length = 0;
      this.width = width;
      this.height = height;
    },
    fillRect({rect, color}) {
      this.paintBoxes.push({
        style: {
          position: 'absolute',
          boxSizing: 'border-box',
          top: `${rect.y}px`,
          left: `${rect.x}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          backgroundColor: color
        }
      });
    },
    drawBorder({rect, border}) {
      let style = {
        position: 'absolute',
        boxSizing: 'border-box',
        top: `${rect.y}px`,
        left: `${rect.x}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`
      };
      ['top', 'right', 'bottom', 'left'].forEach((side) => {
        style[`border-${side}-width`] = border[side].width + 'px';
        style[`border-${side}-style`] = border[side].style;
        style[`border-${side}-color`] = border[side].color;
      });
      this.paintBoxes.push({ style });
    },
    drawWidget({widget, rect, clip}) {
      let style = {
        position: 'absolute',
        top: `${rect.y}px`,
        left: `${rect.x}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundImage: `url(${widget})`,
        backgroundSize: `${rect.width}px ${rect.height}px`,
      }
      if (clip) {
        const top = clip.y - rect.y;
        const left = clip.x - rect.x;
        const bottom = top + clip.height;
        const right = left + clip.width;
        style.clip = `rect(${top}px, ${right}px, ${bottom}px, ${left}px)`;
      }
      this.paintBoxes.push({ style });
    },
    drawTiles({widget, rect, clip}) {
      let style = {
        position: 'absolute',
        top: `${clip.y}px`,
        left: `${clip.x}px`,
        width: `${clip.width}px`,
        height: `${clip.height}px`,
        backgroundImage: `url('${widget}')`,
        backgroundOrigin: 'border-box',
        backgroundPosition: `${rect.x - clip.x}px ${rect.y - clip.y}px`,
        backgroundSize: `${rect.width}px ${rect.height}px`,
        backgroundRepeat: 'repeat',
      }
      this.paintBoxes.push({ style });
    },
    endPaint() {
      seqNo = 0;
      pendingMessages = {};
    }
  }
};

// app

const app = new Vue({
  el: '#app',
  data: () => surface,
  components: {
    'connect-view': ConnectView,
    'surface-view': SurfaceView
  }
});
