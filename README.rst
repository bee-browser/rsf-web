====================================
 rsf-web - Web-based Remote Surface
====================================

rsf-web is a web-based remote surface on which a layout result is painted.

rsf-web receives paint messages through a specified `Pusher`_ channel, and
paints a layout result using HTML elements.

Files in the ``src`` folder are automatically deployed onto
https://bee-rsf-web.netlify.com/ after every commit.


Development
===========

It's recommended to use `BrowserSync`_::

    $ npm install -g browser-sync
    $ browser-sync start --config bs-config.js


Dependencies
============

* `Lodash`_ (MIT)
* `jQuery`_ (MIT)
* `Semantic UI`_ (MIT)
* `Vue.js`_ (MIT)
* `pusher-js`_ (MIT)


License
=======

This software is distributed under the MIT license.  See `LICENSE`_ file for
details.


.. _Pusher: https://pusher.com/
.. _BrowserSync: https://www.browsersync.io/
.. _Lodash: https://lodash.com/
.. _jQuery: https://jquery.com/
.. _Semantic UI: https://semantic-ui.com/
.. _Vue.js: https://vuejs.org/
.. _pusher-js: https://github.com/pusher/pusher-js
.. _LICENSE: ./LICENSE
