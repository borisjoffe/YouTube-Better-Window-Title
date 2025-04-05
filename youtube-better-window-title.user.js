// ==UserScript==
// @name         YouTube Better Window Title
// @namespace    http://borisjoffe.com
// @version      1.3.2
// @description  Add video length in minutes (rounded) and Channel Name to Window Title
// @author       Boris Joffe
// @match        https://*.youtube.com/watch?*
// @match        https://*.youtube.com/shorts/*
// @grant        unsafeWindow
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      MIT
// ==/UserScript==

/*
The MIT License (MIT)

Copyright (c) 2018, 2020-2025 Boris Joffe

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


function getExpandComments() { return JSON.parse(GM_getValue('expandcomments', false)) }
console.log('expandcomments', getExpandComments())

function getQuickReport() { return JSON.parse(GM_getValue('quickreport', false)) }
console.log('quickreport', getQuickReport())

GM_registerMenuCommand("Set EXPAND_COMMENTS", function() {
    var val = prompt("Value for EXPAND_COMMENTS? (true or false) Current value is listed below", getExpandComments())
    GM_setValue("expandcomments", !!JSON.parse(val));
})

GM_registerMenuCommand("Set QUICK_REPORT_COMMENT", function() {
    var val = prompt("Value for QUICK_REPORT_COMMENT? (true or false) Current value is listed below", getQuickReport())
    GM_setValue("quickreport", !!JSON.parse(val));
})

// Util
const DEBUG = false;
function dbg() {
	if (DEBUG)
		console.log.apply(console, arguments);

	return arguments[0];
}


var
	qs = document.querySelector.bind(document),
	qsa = document.querySelectorAll.bind(document),
	err = console.error.bind(console),
	log = console.log.bind(console),
	euc = encodeURIComponent;

function qsv(elmStr, parent) {
	var elm
	if (typeof parent === 'string') elm = qsv(parent).querySelector(elmStr)
	else if (typeof parent === 'object') elm = parent.querySelector(elmStr)
	else elm = qs(elmStr);

	if (!elm) err('(qs) Could not get element -', elmStr);
	return elm;
}

function qsav(elmStr, parent) {
	var elm
	if (typeof parent === 'string') elm = qsv(parent).querySelectorAll(elmStr)
	else if (typeof parent === 'object') elm = parent.querySelectorAll(elmStr)
	else elm = qsa(elmStr);

	if (!elm) err('(qsa) Could not get element -', elmStr);
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
	return qsv('.ytp-progress-bar').getAttribute('aria-valuemax')
	// return unsafeWindow.ytInitialPlayerResponse.videoDetails.lengthSeconds;
}

function getVideoLengthFriendly() {
	// TODO: update
	return Math.round(getVideoLengthSeconds() / 60) + 'm';
}

function getChannelName() {
	return qsv('#channel-name a').innerText.replaceAll('\n', '').trim()
	// return unsafeWindow.ytInitialPlayerResponse.videoDetails.author;
}

function getChannelNameShort() {
	return getChannelName().substr(0, 20);
}

function getVideoTitle() {
	return qsv('.title.ytd-video-primary-info-renderer').innerText
	// return unsafeWindow.ytInitialPlayerResponse.videoDetails.title;
}

function getVideoTitleShort() {
	return getVideoTitle()//.substr(0, 30);
}

function updateWindowTitle() {
	dbg('updateWindowTitle()');
	var videoLength = getVideoLengthFriendly();
	var channelName = getChannelNameShort();
	var videoTitle = getVideoTitleShort();

	// Don't duplicate channel name if it's part of the video title
	if (videoTitle.startsWith(channelName))
		videoTitle = videoTitle.substring(channelName.length)
	// Trim leading dashes e.g. often used as "<artist> - <title>"
	if (videoTitle.trim().startsWith('-'))
		videoTitle = videoTitle.trim().substring(1).trim()

	setWindowTitle([videoLength + ',' + channelName, videoTitle].join('—'));
	setTimeout(updateWindowTitle, (DEBUG ? 5_000 : 5_000));
}

function getVideoDate() {
	return getProp(qsv('#date'), 'innerText', '').trim() || qsv('meta[itemprop="uploadDate"]').getAttribute('content').split('T')[0]
}

function getVideoYear() {
	const dateArr = getVideoDate().split(',')
	return dateArr[dateArr.length - 1].trim()
}

function createWikiLink() {
	return '[[' + window.location.href + '|' + getVideoTitle() + ']] - '
		+ getChannelName() + ', ' + getVideoYear() + ', ' + getVideoLengthFriendly()
}

function $createWikiLink($ev) {
	/*
	qsv('#info.ytd-video-primary-info-renderer').lastChild.innerHTML +=
		'<div class="style-scope ytd-video-primary-info-renderer" style="color: white">'
		+ createWikiLink()
		+ '</div>'
	*/

	dbg('dblclick ev.target', $ev.target)
	if ($ev.target.tagName !== 'SPAN') {
		dbg('SKIPPING dblclick: ev target is not SPAN. Is:', $ev.target.tagName)
		return
	}

	const isValidClassName = ['ytd-video-primary-info-renderer', 'yt-formatted-string']
		.filter(validClassName => $ev.target.className.includes(validClassName))
		.length

	if (isValidClassName) {
		const wikiLink = createWikiLink()
		navigator.clipboard.writeText(wikiLink)
		log('DOUBLE CLICK: wiki link copied to clipboard:', wikiLink)
	} else {
		console.debug('SKIPPING dblclick: ev target is span, but not right class. Classes are:', $ev.target.className)
	}
}


function waitForLoad() {
	log('waitForLoad');

	//dbg(unsafeWindow.ytInitialPlayerResponse, 'unsafeWindow.ytInitialPlayerResponse')

	if (! unsafeWindow.ytInitialPlayerResponse) {
		log('waiting another 2 sec for ytInitialPlayerResponse');
		setTimeout(waitForLoad, 2_000);
		return;
	}

	//dbg('video details:', unsafeWindow.ytInitialPlayerResponse.videoDetails);

	console.debug('video title =', getVideoTitleShort());
	updateWindowTitle();

	// NOTE: some of these IDs are NOT unique on the page
	const eventSelectors = ['#description-inner'/*, '#description', '#info-strings'*/]
	eventSelectors
		.map(selector => qsv(selector).addEventListener('dblclick', $createWikiLink, true))
}

if (getExpandComments())
	setInterval($clickReadMoreInComments, 10_000)

/** Click "Read More" to expand comments and expand replies to comments too */
function $clickReadMoreInComments() {
	qsav('.more-button').forEach(($btn) => $btn.checkVisibility() && $btn.click())
}


if (getQuickReport())
	setInterval($quickReportComment, 5_000)

function handleDropdownClick(e) {
	setTimeout(() => {
		// click "Report"
		qs('ytd-menu-popup-renderer yt-icon').click()
		// click Spam
		setTimeout(() =>
			Array.from(qsa('.YtRadioButtonItemViewModelLabel'))
				.filter(x => x.textContent.includes('Spam'))[0]
				.click()
		, 200)
	}, 250)
}

// Click "Report" when clicking comment dropdown
function $quickReportComment() {
	const dropdownButtons = Array.from(qsa('.yt-icon-button'))
	dropdownButtons.map(btn => {
		btn.removeEventListener('click', handleDropdownClick)
		btn.addEventListener('click', handleDropdownClick)
	})
	log('(YT Better Window Title) Added quickReportComment listener')
}

setTimeout(function () {
	waitForLoad();
}, 6_000);
// window eventListener doesn't work well for some reason
// window.addEventListener('load', waitForLoad, true);
// window.addEventListener('focus', waitForLoad, true);
log('YouTube Better Window Title: started script')

