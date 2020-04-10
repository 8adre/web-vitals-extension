/*
 Copyright 2020 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

// Inlined WebVitals library
// TODO: Switch to use WebVitals ESM or at least external UMD build
// Nuance: Initially experienced issues using imports in Chrome extensions
// where Vitals was silently failing. Requires further investigation.
!function(e,n){"object"==typeof exports&&"undefined"!=typeof module?n(exports):"function"==typeof define&&define.amd?define(["exports"],n):n((e=e||self).webVitals={})}(this,(function(e){"use strict";var n=function(e,n,t,i,r){return function(){t&&(t.takeRecords().map(i),t.disconnect()),"number"==typeof n.value&&(n.isFinal||(n.isFinal=!0,r&&r(n)),e(n))}},t=function(e,n){try{if(PerformanceObserver.supportedEntryTypes.includes(e)){var t=new PerformanceObserver((function(e){return e.getEntries().map(n)}));return t.observe({type:e,buffered:!0}),t}}catch(e){}},i=function(e){return function(n){var t={value:null,entries:[],isFinal:!1};return new Promise((function(i){return e(t,i,n)}))}},r=new Promise((function(e){return["visibilitychange","unload"].map((function(n){return function(e,n){addEventListener(e,(function t(i){"hidden"===document.visibilityState&&(removeEventListener(e,t,!0),n(i))}),!0)}(n,e)}))})),u=i((function(e,i,u){e.value=0;var o=function(n){n.hadRecentInput||(e.value+=n.value,e.entries.push(n),u&&u(e))},s=t("layout-shift",o),a=n(i,e,s,o,u);r.then(a)})),o="hidden"===document.visibilityState?0:1/0;r.then((function(e){return o=e.timeStamp}));var s=function(){return o},a=i((function(e,i,r){var u=function(n){"first-contentful-paint"===n.name&&n.startTime<s()&&(e.value=n.startTime,e.entries.push(n),a())},o=t("paint",u),a=n(i,e,o,u,r)})),c=i((function(e,i,u){var o=function(n){e.value=n.processingStart-n.startTime,e.entries.push(n),a()},s=t("first-input",o),a=n(i,e,s,o,u);r.then(a),s||window.perfMetrics&&window.perfMetrics.onFirstInputDelay&&window.perfMetrics.onFirstInputDelay((function(n,t){e.value=n,e.event=t,a()}))})),f=new Promise((function(e){return["scroll","keydown","pointerdown"].map((function(n){addEventListener(n,e,{once:!0,passive:!0,capture:!0})}))})),p=i((function(e,i,u){var o=!0,a=function(n){o&&s()<n.startTime?p():(e.value=n.startTime,e.entries.push(n),u&&u(e),o=!1)},c=t("largest-contentful-paint",a),p=n(i,e,c,a,u);r.then(p),f.then(p)}));e.getCLS=u,e.getFCP=a,e.getFID=c,e.getLCP=p,Object.defineProperty(e,"__esModule",{value:!0})}));

// Registry for badge metrics
badgeMetrics = {
    lcp: {
        value: 0,
        final: false,
        pass: true
    },
    cls: {
        value: 0,
        final: false,
        pass: true
    },
    fid: {
        value: 0,
        final: false,
        pass: true
    }
};

/**
 * @param  {Object} metrics - Collection of metric values
 * If any metric fails the thresholds at all, we display
 * a red badge.
 */
function scoreBadgeMetrics(metrics) {
    let bucket = 'GOOD';
    if (metrics.lcp.value > 2500) {
        bucket = 'POOR';
        metrics.lcp.pass = false;
    }
    if (metrics.fid.value > 100) {
        bucket = 'POOR';
        metrics.fid.pass = false;
    }
    if (metrics.cls.value > 0.1) {
        bucket = 'POOR';
        metrics.cls.pass = false;
    }
    return bucket;
}

function updateBadgeValue(metric, value, isFinal) {
    console.log(metric, value, isFinal ? '(final)' : '(not final)');
    badgeMetrics[metric].value = value;
    badgeMetrics[metric].final = isFinal;

    let scoreBucket = scoreBadgeMetrics(badgeMetrics);

    // Broadcast metrics updates for badging
    chrome.runtime.sendMessage({ 
        webVitalsScoreBucket: scoreBucket,
        metrics: badgeMetrics 
    });
    // TODO: Once the metrics are final, cache locally.
}

/**
 * Fetches Web Vitals metrics via WebVitals.js
 * We will update the metrics using onChange.
 */
function fetchWebPerfMetrics() {
    webVitals.getCLS((result) => updateBadgeValue('cls', result.value, result.isFinal));
    webVitals.getFID((result) => updateBadgeValue('fid', result.value, result.isFinal));
    webVitals.getLCP((result) => updateBadgeValue('lcp', result.value, result.isFinal));
}

fetchWebPerfMetrics();