import {jsdom} from 'jsdom';
global.document  = jsdom('<html><body></body></html>');
global.window    = document.parentWindow;
global.navigator = window.navigator;

# require('source-map-support').install()
import Promise from 'bluebird';
global.Promise = Promise;

import React from 'react';
global.React = React;

import assert from 'power-assert';
global.assert = assert;

import sinon from 'sinon';
global.sinon = sinon;

import cheerio from 'cheerio';


global.$$ = (html) => cheerio.load(html);
// console.warn = ->

beforeEach(()=> {
    this.sinon = sinon.sandbox.create();
});
afterEach(()=> {
    this.sinon.restore();
    document.body.innerHTML = '';
});
