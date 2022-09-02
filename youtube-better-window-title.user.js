// ==UserScript==
// @name         YouTube Better Window Title
// @namespace    http://borisjoffe.com
// @version      1.0
// @description  Add video length (rounded) and Channel Name to Window Title
// @author       Boris Joffe
// @match        https://*.youtube.com/watch?*
// @grant        unsafeWindow
// ==/UserScript==

/*
The MIT License (MIT)

Copyright (c) 2018 Boris Joffe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/* jshint -W097, -W041 */
/* eslint-disable no-console, no-unused-vars */
'use strict';


// Util
const DEBUG = false;
function dbg() {
	if (DEBUG)
		console.log.apply(console, arguments);

	return arguments[0];
}


var
	qs = document.querySelector.bind(document),
	err = console.error.bind(console),
	log = console.log.bind(console),
	euc = encodeURIComponent;

function qsv(elmStr, parent) {
	var elm = parent ? parent.querySelector(elmStr) : qs(elmStr);
	if (!elm) err('(qs) Could not get element -', elmStr);
	return elm;
}

function getProp(obj, path, defaultValue) {
	path = Array.isArray(path) ? Array.from(path) : path.split('.');
	var prop = obj;

	while (path.length && obj) {
		prop = obj[path.shift()];
	}

	return prop != null ? prop : defaultValue;
}

function getWindowTitle() { return document.title; }

function setWindowTitle(newTitle) {
	document.title = newTitle;
	log('newTitle =', newTitle);
}

function getVideoLengthSeconds() {
	return unsafeWindow.ytInitialPlayerResponse.videoDetails.lengthSeconds;
}

function getVideoLengthFriendly() {
	// TODO: update
	return Math.round(getVideoLengthSeconds() / 60) + 'm';
}

function getChannelName() {
	return unsafeWindow.ytInitialPlayerResponse.videoDetails.author;
}

function getChannelNameShort() {
	// TODO: Update
	// if over 20? chars, extract all capital letters? extract all capital letters chars after first 10?
	return getChannelName().substr(0, 20);
}

function getVideoTitle() {
	return unsafeWindow.ytInitialPlayerResponse.videoDetails.title;
}

function getVideoTitleShort() {
	return getVideoTitle()//.substr(0, 30);
}

function updateWindowTitle() {
	dbg('updateWindowTitle()');
	var videoLength = getVideoLengthFriendly();
	var channelName = getChannelNameShort();
	var videoTitle = getVideoTitleShort();

// 	setWindowTitle([videoLength, channelName, videoTitle].join('—'));
	setWindowTitle([videoLength + ', ' + channelName, videoTitle].join('—'));
	setTimeout(updateWindowTitle, (DEBUG ? 4000 : 4000));
	//isTitleUpdated = true;

	// TODO: add extra title for pasting into zim
	// <full video title> - <short channel name>, YYYY-MM, <video length minutes>
	// [[url:<full video title>]] - <short channel name>, YYYY-MM, <video length minutes>
	// <short channel name> - [[url:<full video title>]], YYYY-MM, <video length minutes>
}


var isTitleUpdated = false;
function waitForLoad() {
	log('waitForLoad');
	if (isTitleUpdated) return;

	//dbg(unsafeWindow.ytInitialPlayerResponse, 'unsafeWindow.ytInitialPlayerResponse')

	if (! unsafeWindow.ytInitialPlayerResponse) {
		log('waiting another 2 sec for ytInitialPlayerResponse');
		setTimeout(waitForLoad, 2000);
		return;
	}

	//dbg('video details:', unsafeWindow.ytInitialPlayerResponse.videoDetails);

	//setTimeout(function () {
		// TODO: can setTimeout be removed?
		// log('e.target =', e.target);
		//var innerHtml = e.target.innerHTML;
		// log('innerHTML length =', innerHtml.length);
		// TODO: delete below check (and replace qsv with qs?) - it's ugly
		//if (innerHtml.length > 150 || !innerHtml.includes('Add to calendar'))
		//	return;  // quick return to avoid multiple querySelectors
		//if (qsv('.event-description') && qsv('a[href*="google.com/calendar"]')) {
			log('video title =', getVideoTitleShort());
			updateWindowTitle();
		//}
	//}, 20);
}

setTimeout(function () {
	waitForLoad();
}, 8000);
// window eventListener doesn't work well for some reason
// 	window.addEventListener('load', waitForLoad, true);
log('youtube better window title')