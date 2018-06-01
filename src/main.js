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
  height: 200,
  paintBoxes: []
};

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
        this.startPaint(msg.width, msg.height);
        break;
      case 'fill_rect':
        this.fillRect(msg.rect, msg.color);
        break;
      case 'draw_border':
        this.drawBorder(msg.rect, msg.border);
        break;
      case 'draw_widget':
        this.drawWidget(msg.widget, msg.rect, msg.clip);
        break;
      case 'draw_tiles':
        this.drawTiles(msg.widget, msg.rect, msg.clip);
        break;
      case 'end_paint':
        this.flush();
        break;
      }
    },
    startPaint(width, height) {
      this.paintBoxes.length = 0;
      this.width = width;
      this.height = height;
    },
    fillRect(rect, color) {
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
    drawBorder(rect, border) {
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
    drawWidget(widget, rect, clip) {
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
    drawTiles(widget, rect, clip) {
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
    flush() {
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
