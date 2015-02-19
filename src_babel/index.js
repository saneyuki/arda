'use strict';

import Component from './component';
import Context from './context';
import DefaultLayout from './default-layout';
import Router from './router';
import mixin from './mixin';

// for typescript
const subscriber = function (id) {
  return id;
}

const Arda = Object.freeze({
  Component,
  Context,
  DefaultLayout,
  Router,
  subscriber,
});

export default Arda;
